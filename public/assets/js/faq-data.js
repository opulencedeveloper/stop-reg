
const FAQ_DATA = [
    {
        question: "What is StopReg.com?",
        answer: "StopReg.com is an email intelligence and validation platform that helps you detect fake signups, disposable emails, and relay/alias addresses in real time so you can focus on real users."
    },
    {
        question: "What types of emails can StopReg detect?",
        answer: `StopReg analyzes email addresses and domains to identify several types of email addresses, including:
        <ul>
            <li>Disposable email addresses: Temporary email addresses created for short-term or one-time use.</li>
            <li>Relay email addresses: Addresses that forward or relay messages through an intermediary service.</li>
            <li>Alias and forwarding addresses: Including native aliases and forwarding services such as Apple Hide My Email, Firefox Relay, and public aliases such as user.dhk+jk@gmail.com.</li>
            <li>Role-based addresses: Addresses associated with roles or departments, such as admin@, support@, and sales@.</li>
            <li>Public email addresses: Addresses from commonly used providers such as Gmail, Yahoo, and Outlook.</li>
            <li>Educational email addresses: Addresses associated with educational institutions.</li>
            <li>ISP email addresses: Addresses provided by internet service providers.</li>
            <li>Subdomain-based email addresses: Addresses created through subdomain names associated with free subdomains provider eg domains from stackryze.com, afraid.org etc.</li>
        </ul>`
    },
    {
        question: "Will this affect real users?",
        answer: "No. StopReg is designed to minimize false positives. Legitimate users can still sign up without friction while suspicious emails are filtered out."
    },
    {
        question: "What types of email addresses does the StopReg API detect?",
        answer: `Yes. Our API analyzes emails instantly during signup and classifies them into clear categories, including:
        <ul>
            <li>Disposable email</li>
            <li>Relay email</li>
            <li>Free email provider</li>
            <li>Alias email</li>
            <li>Role-based email</li>
            <li>Native and forwarding aliases</li>
            <li>ISP email</li>
            <li>EDU email</li>
            <li>Free subdomain-based email</li>
        </ul>
        Based on these classifications, you can apply your own enforcement policies to:
        <ul>
            <li>Block unwanted email types</li>
            <li>Allow trusted email types</li>
            <li>Flag addresses for manual review</li>
        </ul>
        This gives you control over how different email classifications are handled during signup, registration, and lead collection.`
    },
    {
        question: "How fast is the API response?",
        answer: "Our API is optimized for speed and typically responds in under 300ms, making it suitable for real-time applications."
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
        answer: "Yes. Feel free to test the free trial with 200 API requests per month."
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
