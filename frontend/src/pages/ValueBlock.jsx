import { Brain, MessageCircle, Sprout } from 'lucide-react';

export function ValueBlock() {
  const values = [
    {
      icon: Brain,
      title: 'Focus',
      description: 'Build clarity and concentration',
    },
    {
      icon: MessageCircle,
      title: 'Accountability',
      description: 'Stay committed with peer support',
    },
    {
      icon: Sprout,
      title: 'Growth',
      description: 'Develop habits that last',
    },
  ];

  return (
    <section className="bg-white px-6 py-12">
      <div className="max-w-xl mx-auto space-y-8">
        {/* Mission Statement */}
        <p className="text-gray-700 leading-relaxed text-center">
          We combine structure, community, and mentorship to help you build 
          habits that last — without endless scrolling or pressure.
        </p>

        {/* Value Icons */}
        <div className="grid grid-cols-1 gap-8 pt-4">
          {values.map((value) => {
            const Icon = value.icon;
            return (
              <div key={value.title} className="flex flex-col items-center text-center">
                <div className="mb-3">
                  <Icon className="w-8 h-8 text-gray-700" strokeWidth={1.5} />
                </div>
                <h3 className="text-foreground mb-1">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
