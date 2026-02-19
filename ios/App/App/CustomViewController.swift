import UIKit
import Capacitor

class CustomViewController: CAPBridgeViewController {

    private let bgColor = UIColor(red: 30.0/255.0, green: 27.0/255.0, blue: 75.0/255.0, alpha: 1.0)

    override func viewDidLoad() {
        super.viewDidLoad()

        // Extend layout to fill entire screen including behind bars and safe areas
        edgesForExtendedLayout = .all
        extendedLayoutIncludesOpaqueBars = true

        // Set the root view background — this is what shows in the safe area
        view.backgroundColor = bgColor

        // Set the WebView and its scroll view backgrounds
        webView?.isOpaque = false
        webView?.backgroundColor = bgColor
        webView?.scrollView.backgroundColor = bgColor

        // Prevent scroll view from adjusting content insets for safe area
        webView?.scrollView.contentInsetAdjustmentBehavior = .never

        // Ensure the WebView fills the entire view including safe areas
        if let webView = webView {
            webView.translatesAutoresizingMaskIntoConstraints = false
            NSLayoutConstraint.activate([
                webView.topAnchor.constraint(equalTo: view.topAnchor),
                webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
                webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
                webView.trailingAnchor.constraint(equalTo: view.trailingAnchor)
            ])
        }
    }
}
