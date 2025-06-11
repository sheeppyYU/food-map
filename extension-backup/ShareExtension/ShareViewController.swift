import UIKit

class ShareViewController: UIViewController {

    @IBOutlet weak var storeNameTextField: UITextField!
    @IBOutlet weak var saveButton: UIButton!
    @IBOutlet weak var categoryTextField: UITextField!
    @IBOutlet weak var addressTextField: UITextField!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        saveButton.isEnabled = false
        [storeNameTextField, addressTextField, categoryTextField].forEach {
            $0?.addTarget(self, action: #selector(textFieldsChanged), for: .editingChanged)
        }
    }

    @objc func textFieldsChanged() {
        let allFilled = !(storeNameTextField.text?.isEmpty ?? true)
            && !(addressTextField.text?.isEmpty ?? true)
            && !(categoryTextField.text?.isEmpty ?? true)
        saveButton.isEnabled = allFilled
    }

    @IBAction func savePinTapped(_ sender: UIButton) {
        _ = storeNameTextField.text ?? ""
        _ = addressTextField.text ?? ""
        _ = categoryTextField.text ?? ""
        // 這裡可以呼叫主 App 或儲存資料
        self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }
}
