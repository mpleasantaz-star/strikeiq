import SwiftUI

enum StrikeIQTheme {
    static let electricBlue = Color(red: 0.039, green: 0.518, blue: 1.0)
    static let neonBlue = Color(red: 0.298, green: 0.788, blue: 0.941)
    static let deepNavy = Color(red: 0.043, green: 0.059, blue: 0.102)
    static let trueBlack = Color(red: 0.020, green: 0.027, blue: 0.039)
    static let darkSlate = Color(red: 0.102, green: 0.133, blue: 0.200)
    static let success = Color(red: 0.133, green: 0.773, blue: 0.369)
    static let warning = Color(red: 0.961, green: 0.620, blue: 0.043)
    static let error = Color(red: 0.937, green: 0.267, blue: 0.267)

    static let appGradient = LinearGradient(
        colors: [electricBlue, neonBlue, deepNavy],
        startPoint: .leading,
        endPoint: .trailing
    )
}
