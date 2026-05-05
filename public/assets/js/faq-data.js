
const FAQ_DATA = [
    {
        question: "What is StopReg.com?",
        answer: "StopReg.com is an email intelligence and validation platform that helps you detect fake signups, disposable emails, and relay/alias addresses in real time so you can focus on real users."
    },
    {
        question: "What types of emails can StopReg detect?",
        answer: `StopReg identifies:
        <ul>
            <li>Disposable email addresses</li>
            <li>Relay/alias emails (like Apple Hide My Email, Firefox Relay)</li>
            <li>Role-based emails (e.g. admin@, support@)</li>
            <li>High-risk or suspicious domains</li>
        </ul>`
    },
    {
        question: "Will this affect real users?",
        answer: "No. StopReg is designed to minimize false positives. Legitimate users can still sign up without friction while suspicious emails are filtered out."
    },
    {
        question: "Can StopReg block fake signups in real time?",
        answer: `Yes. Our API analyzes emails instantly during signup and classifies them into clear categories, including:
        <ul>
            <li>Disposable</li>
            <li>Relay</li>
            <li>Free email provider</li>
            <li>Alias</li>
        </ul>
        Based on this classification, you can:
        <ul>
            <li>Block</li>
            <li>Allow</li>
            <li>Or flag for review</li>
        </ul>`
    },
    {
        question: "How fast is the API response?",
        answer: "Our API is optimized for speed and typically responds in under 500ms, making it suitable for real-time applications."
    },
    {
        question: "Do I need technical skills to integrate?",
        answer: `Not much. You can integrate StopReg using:
        <ul>
            <li>Simple API calls</li>
            <li>JavaScript or backend (PHP, Node.js, etc.)</li>
        </ul>
        Most users are up and running in minutes.`
    },
    {
        question: "Is there a free plan?",
        answer: "Yes. Feel free to test the free trial with 1,000 API requests per month."
    },
    {
        question: "Who should use StopReg?",
        answer: `StopReg is ideal for:
        <ul>
            <li>SaaS platforms</li>
            <li>Marketplaces</li>
            <li>Email marketing tools</li>
            <li>Any service struggling with fake or low-quality signups</li>
        </ul>`
    }
];

// Export if in a module environment, otherwise attach to window
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FAQ_DATA;
} else {
    window.FAQ_DATA = FAQ_DATA;
}
