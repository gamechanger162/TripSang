'use client';

import { useState } from 'react';
import { Mail, MessageSquare, ChevronDown, ChevronUp, Search, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function HelpSupportPage() {
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
    const [searchQuery, setSearchQuery] = useState('');

    const faqs = [
        {
            question: "How do I join a squad?",
            answer: "You can join a squad by clicking the 'Join Squad' button on any trip page. If the trip is private, you may need a code from the trip creator."
        },
        {
            question: "Is TripSang free to use?",
            answer: "Yes! TripSang offers a free tier that allows you to join trips and create your own. We also offer premium plans for advanced features like unlimited trips and exclusive badges."
        },
        {
            question: "How do I verify my profile?",
            answer: "Go to your profile settings and click on 'Verify Identity'. You'll need to upload a government-issued ID. Verification usually takes 24-48 hours."
        },
        {
            question: "Can I cancel a trip I created?",
            answer: "Yes, you can cancel a trip from the trip settings page. Please notify your squad members before cancelling."
        },
        {
            question: "How do payments work?",
            answer: "We use secure payment gateways for all transactions. You can pay using UPI, credit/debit cards, or net banking."
        }
    ];

    const filteredFaqs = faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        How can we help you?
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Search our help center or browse frequently asked questions.
                    </p>

                    {/* Search Bar */}
                    <div className="mt-8 max-w-xl mx-auto relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm shadow-sm transition-all"
                            placeholder="Search for answers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-16">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow text-center group">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Chat Support</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Chat with our support team for quick answers.</p>
                        <Link href="/contact" className="text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline">
                            Start Chat &rarr;
                        </Link>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow text-center group">
                        <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <Mail className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Email Us</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Send us an email and we'll get back to you.</p>
                        <a href="mailto:support@tripsang.com" className="text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline">
                            support@tripsang.com
                        </a>
                    </div>
                </div>

                {/* FAQs */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredFaqs.length > 0 ? (
                            filteredFaqs.map((faq, index) => (
                                <div key={index} className="p-6">
                                    <button
                                        onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                                        className="w-full flex items-center justify-between text-left focus:outline-none"
                                    >
                                        <span className="font-medium text-gray-900 dark:text-white pr-4">{faq.question}</span>
                                        {openFaqIndex === index ? (
                                            <ChevronUp className="w-5 h-5 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                        )}
                                    </button>
                                    {openFaqIndex === index && (
                                        <div className="mt-3 text-gray-600 dark:text-gray-400 leading-relaxed animate-fadeIn">
                                            {faq.answer}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                No results found for "{searchQuery}"
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Still can't find what you're looking for?
                    </p>
                    <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg font-medium"
                    >
                        Contact Support Team <ExternalLink className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
