import { Instagram, Linkedin, Youtube } from 'lucide-react';

export function Footer({ onNavigate }) {
  const links = [
    { label: 'FAQs', page: 'faqs' },
    { label: 'Contact', page: 'contact' },
    { label: 'Terms', page: null },
    { label: 'Privacy', page: null },
  ];
  const socialLinks = [
    { icon: Instagram, label: 'Instagram', href: '#' },
    { icon: Linkedin, label: 'LinkedIn', href: '#' },
    { icon: Youtube, label: 'YouTube', href: '#' },
  ];

  const handleClick = (page) => {
    if (page && onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <footer className="bg-background border-t border-border px-6 py-8">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Navigation Links */}
        <div className="flex flex-wrap justify-center gap-4 text-muted-foreground">
          {links.map((link, index) => (
            <span key={link.label} className="flex items-center gap-4">
              <button 
                onClick={() => handleClick(link.page)}
                className="hover:text-foreground transition-colors"
              >
                {link.label}
              </button>
              {index < links.length - 1 && (
                <span className="text-muted-foreground/50">|</span>
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
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon className="w-5 h-5" />
              </a>
            );
          })}
        </div>

        {/* Copyright */}
        <div className="text-center text-muted-foreground">
          <p>© PeerSupportHub 2025</p>
        </div>
      </div>
    </footer>
  );
}
