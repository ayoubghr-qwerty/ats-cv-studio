#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Info)
                .build(),
        );
    // Focus the existing window when a second instance is launched
    // instead of spawning another process competing for the same files.
    builder = builder.plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
        use tauri::Manager;
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.show();
            let _ = window.unminimize();
            let _ = window.set_focus();
        }
    }));

    // Remember window size/position/maximized state across sessions.
    // The hidden PDF export windows are excluded: the plugin shows and
    // focuses every tracked window when it is created, which would flash
    // the export window on screen (and steal focus) on every export.
    builder = builder.plugin(
        tauri_plugin_window_state::Builder::new()
            .with_filter(|label| !label.starts_with("pdf-export-"))
            .build(),
    );

    #[cfg(windows)]
    {
        builder = builder.invoke_handler(tauri::generate_handler![export_pdf]);
    }

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(windows)]
#[tauri::command]
async fn export_pdf(
    app: tauri::AppHandle,
    document_id: String,
    document_kind: String,
    output_path: String,
    page_size: String,
) -> Result<(), String> {
    use std::sync::mpsc;
    use std::time::{Duration, SystemTime, UNIX_EPOCH};

    use tauri::{Listener, WebviewUrl, WebviewWindowBuilder};
    use webview2_com::PrintToPdfCompletedHandler;
    use webview2_com::Microsoft::Web::WebView2::Win32::{
        COREWEBVIEW2_PRINT_ORIENTATION_PORTRAIT, ICoreWebView2_7, ICoreWebView2Environment6,
    };
    use windows_core::Interface;

    let label = format!(
        "pdf-export-{}",
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0)
    );
    let route = format!("print/{document_kind}/{document_id}");

    // WebView2 requires every environment sharing a user-data dir to use
    // identical options: the main window sets custom additionalBrowserArgs in
    // tauri.conf, so the export window must inherit them or its webview
    // creation fails with 0x8007139F (same user-data dir, different options).
    let main_browser_args = app
        .config()
        .app
        .windows
        .iter()
        .find(|w| w.label == "main")
        .and_then(|w| w.additional_browser_args.clone());

    let (tx, rx) = mpsc::channel();
    let app2 = app.clone();
    let label2 = label.clone();
    let route2 = route.clone();
    app.run_on_main_thread(move || {
        let mut builder =
            WebviewWindowBuilder::new(&app2, &label2, WebviewUrl::App(route2.into()))
                .visible(false)
                // Never steal focus: wry moves WebView2 focus into a new
                // webview when focused, which activates (and thereby shows)
                // the hidden export window as a visible flash. Skipping the
                // taskbar too so no button can appear for it either.
                .focused(false)
                .skip_taskbar(true)
                .title("PDF Export")
                .background_throttling(tauri::utils::config::BackgroundThrottlingPolicy::Disabled);
        if let Some(args) = main_browser_args.as_deref() {
            builder = builder.additional_browser_args(args);
        }
        let result = builder.build();
        let _ = tx.send(result);
    })
    .map_err(|e| e.to_string())?;
    let window = rx
        .recv()
        .map_err(|_| "window creation channel closed".to_string())?
        .map_err(|e| e.to_string())?;
    log::info!("pdf export window created: label={label} route={route}");

    let (tx_ready, rx_ready) = mpsc::channel::<()>();
    window.listen("print-view-ready", move |_| {
        let _ = tx_ready.send(());
    });

    // Lifecycle traces emitted by the print view (route boot, storage read,
    // ready handshake). Logged so a stuck export shows where it stopped.
    window.listen("print-view-trace", |event| {
        log::info!("print-view trace: {}", event.payload());
    });

    log::info!("pdf export waiting for print-view-ready: label={label}");

    rx_ready
        .recv_timeout(Duration::from_secs(30))
        .map_err(|e| {
            let _ = window.close();
            match e {
                mpsc::RecvTimeoutError::Timeout => "print view did not load in time".to_string(),
                _ => "print view channel closed".to_string(),
            }
        })?;
    log::info!("pdf export print-view ready: label={label}");

    let (tx_done, rx_done) = mpsc::channel::<Result<bool, String>>();
    let out_path = output_path.clone();
    let page_size2 = page_size.clone();
    // Close the hidden window on every exit path below: a failed export must
    // not leak an invisible window that keeps running the app a second time.
    window
        .with_webview(move |webview| {
            let tx_err = tx_done.clone();
            let result = (|| -> windows_core::Result<()> {
                let controller = webview.controller();
                let core = unsafe { controller.CoreWebView2()? };
                let core7 = core.cast::<ICoreWebView2_7>()?;
                let env = webview.environment();
                let env6 = env.cast::<ICoreWebView2Environment6>()?;
                let settings = unsafe { env6.CreatePrintSettings()? };
                unsafe {
                    settings.SetOrientation(COREWEBVIEW2_PRINT_ORIENTATION_PORTRAIT)?;
                    settings.SetScaleFactor(1.0)?;
                    let (w, h) = if page_size2 == "letter" {
                        (8.5, 11.0)
                    } else {
                        (8.27, 11.69)
                    };
                    settings.SetPageWidth(w)?;
                    settings.SetPageHeight(h)?;
                    settings.SetMarginTop(0.0)?;
                    settings.SetMarginBottom(0.0)?;
                    settings.SetMarginLeft(0.0)?;
                    settings.SetMarginRight(0.0)?;
                    settings.SetShouldPrintBackgrounds(true)?;
                    settings.SetShouldPrintHeaderAndFooter(false)?;
                }
                let path = windows_core::HSTRING::from(&out_path);
                let handler = PrintToPdfCompletedHandler::create(Box::new(move |hr, ok| {
                    let _ = tx_done.send(Ok(ok));
                    hr
                }));
                unsafe { core7.PrintToPdf(&path, &settings, &handler)? };
                Ok(())
            })();
            if let Err(e) = result {
                let _ = tx_err.send(Err(e.to_string()));
            }
        })
        .map_err(|e| {
            let _ = window.close();
            e.to_string()
        })?;
    log::info!("pdf export printing started: label={label} path={output_path}");

    let print_result = rx_done.recv_timeout(Duration::from_secs(60)).map_err(|_| {
        let _ = window.close();
        "PDF printing timed out".to_string()
    });

    let _ = window.close();

    match print_result {
        Ok(Ok(true)) => {
            log::info!("pdf export done: path={output_path}");
            Ok(())
        }
        Ok(Ok(false)) => {
            log::warn!("pdf export failed (printer reported failure): path={output_path}");
            Err("PDF printing failed".to_string())
        }
        Ok(Err(e)) => {
            log::warn!("pdf export failed: {e}");
            Err(e)
        }
        Err(e) => Err(e),
    }
}
