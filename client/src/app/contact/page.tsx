'use client';

import { Mail, MapPin, Phone } from 'lucide-react';

export default function ContactPage() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-8 text-center">Contact Us</h1>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
                <div className="grid md:grid-cols-2 gap-12">

                    {/* Contact Info */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Get in Touch</h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Have questions about TripSang? We are here to help. Reach out to us via email or visit our office.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">Email</h3>
                                    <a href="mailto:support@tripsang.com" className="text-gray-600 dark:text-gray-400 hover:text-primary-600">
                                        support@tripsang.com
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">Registered Office</h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        TripSang HQ<br />
                                        Bettiah, Bihar, India
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Support Form */}
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl">
                        <h3 className="text-lg font-semibold mb-4">Send us a message</h3>
                        <form
                            className="space-y-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                                const email = (form.elements.namedItem('email') as HTMLInputElement).value;
                                const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value;

                                window.location.href = `mailto:support@tripsang.com?subject=Support Request from ${name}&body=${message}%0D%0A%0D%0AFrom: ${email}`;
                            }}
                        >
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input name="name" type="text" className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" placeholder="Your name" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input name="email" type="email" className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" placeholder="your@email.com" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Message</label>
                                <textarea name="message" className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" rows={4} placeholder="How can we help?" required></textarea>
                            </div>
                            <button type="submit" className="w-full btn-primary py-2">Send Message</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
