import UIKit
import Capacitor
import WebKit

class CustomViewController: CAPBridgeViewController {

    private let bgColor = UIColor(red: 30.0/255.0, green: 27.0/255.0, blue: 75.0/255.0, alpha: 1.0)

    override func viewDidLoad() {
        super.viewDidLoad()

        edgesForExtendedLayout = .all
        extendedLayoutIncludesOpaqueBars = true
        viewRespectsSystemMinimumLayoutMargins = false

        view.backgroundColor = bgColor
        view.insetsLayoutMarginsFromSafeArea = false

        webView?.isOpaque = false
        webView?.backgroundColor = bgColor
        webView?.scrollView.backgroundColor = bgColor
        webView?.scrollView.contentInsetAdjustmentBehavior = .never

        // Remove any existing constraints Capacitor placed on the WebView
        if let webView = webView {
            for constraint in view.constraints {
                if constraint.firstItem === webView || constraint.secondItem === webView {
                    view.removeConstraint(constraint)
                }
            }
            // Pin WebView to the physical screen edges, ignoring safe area
            webView.translatesAutoresizingMaskIntoConstraints = false
            NSLayoutConstraint.activate([
                webView.topAnchor.constraint(equalTo: view.topAnchor),
                webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
                webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
                webView.trailingAnchor.constraint(equalTo: view.trailingAnchor)
            ])
        }
    }

    // Force the WebView frame to match the full view bounds after every layout pass
    // This overrides any safe area insets Capacitor may apply
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        webView?.frame = view.bounds
    }
}
