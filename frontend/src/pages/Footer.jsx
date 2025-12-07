import { Instagram, Linkedin, Youtube } from 'lucide-react';

export function Footer() {
  const links = ['FAQs', 'Contact', 'Terms', 'Privacy'];
  const socialLinks = [
    { icon: Instagram, label: 'Instagram', href: '#' },
    { icon: Linkedin, label: 'LinkedIn', href: '#' },
    { icon: Youtube, label: 'YouTube', href: '#' },
  ];

  return (
    <footer className="bg-white border-t border-gray-200 px-6 py-8">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Navigation Links */}
        <div className="flex flex-wrap justify-center gap-4 text-gray-600">
          {links.map((link, index) => (
            <span key={link} className="flex items-center gap-4">
              <a href="#" className="hover:text-foreground transition-colors">
                {link}
              </a>
              {index < links.length - 1 && (
                <span className="text-gray-300">|</span>
              )}
            </span>
          ))}
        </div>

        {/* Social Icons */}
        <div className="flex justify-center gap-6">
          {socialLinks.map((social) => {
            const Icon = social.icon;
            return (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon className="w-5 h-5" />
              </a>
            );
          })}
        </div>

        {/* Copyright */}
        <div className="text-center text-gray-500">
          <p>© PeerSupportHub 2025</p>
        </div>
      </div>
    </footer>
  );
}
