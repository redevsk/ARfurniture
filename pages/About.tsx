
import React from 'react';
import { MapPin, Award, Clock, Briefcase, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const About: React.FC = () => {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-slate-900 py-24 px-4 sm:px-6 lg:px-8 text-center">
        <div className="absolute inset-0 overflow-hidden">
           <img 
             src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80" 
             alt="Office background" 
             className="w-full h-full object-cover opacity-20"
           />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">
            Redefining Space with AR Technology
          </h1>
          <p className="text-xl text-slate-300 mb-8 font-light">
            Experience furniture like never before. Visualize, customize, and decide with confidence.
          </p>
        </div>
      </div>

      {/* Business Info Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
           <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6 font-serif">Who We Are</h2>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                ARniture is a pioneering e-commerce platform bridging the gap between digital shopping and physical reality. 
                We believe that buying furniture shouldn't be a guessing game. By combining high-quality craftsmanship with cutting-edge Augmented Reality, we bring the showroom to your living room.
              </p>
              
              <div className="space-y-6">
                  <div className="flex items-start gap-4">
                      <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600 shrink-0">
                          <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                          <h3 className="font-bold text-slate-900 text-lg">Location</h3>
                          <p className="text-slate-600">123 Innovation Drive, Suite 400<br/>San Francisco, CA 94105</p>
                      </div>
                  </div>

                  <div className="flex items-start gap-4">
                      <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600 shrink-0">
                          <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                          <h3 className="font-bold text-slate-900 text-lg">What We Offer</h3>
                          <p className="text-slate-600">
                            A curated selection of premium modern furniture featuring:
                            <ul className="list-disc list-inside mt-1 text-sm">
                                <li>Instant AR visualization in your own space</li>
                                <li>AI-powered interior design assistance</li>
                                <li>White-glove delivery service</li>
                            </ul>
                          </p>
                      </div>
                  </div>

                   <div className="flex items-start gap-4">
                      <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600 shrink-0">
                          <Clock className="w-5 h-5" />
                      </div>
                      <div>
                          <h3 className="font-bold text-slate-900 text-lg">Experience</h3>
                          <p className="text-slate-600">
                             Founded in 2020, we have over 4 years of dedicated experience revolutionizing the way people shop for their homes, serving over 10,000 happy customers.
                          </p>
                      </div>
                  </div>
              </div>
           </div>
           
           <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl bg-slate-100">
              <img 
                src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80"
                alt="Showroom"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm p-4 rounded-xl max-w-xs">
                  <p className="text-sm font-bold text-slate-900">"The future of furniture shopping is here."</p>
                  <p className="text-xs text-slate-500 mt-1">- Interior Design Weekly</p>
              </div>
           </div>
        </div>

        {/* Sample Work / Gallery */}
        <div className="py-8 border-t border-slate-100">
            <div className="flex justify-between items-end mb-8 mt-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 font-serif">Sample Portfolio</h2>
                    <p className="text-slate-500 mt-2">Real homes transformed with ARniture pieces.</p>
                </div>
                <Link to="/" className="text-indigo-600 font-bold hover:underline flex items-center gap-2">
                    Explore Collection <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="group relative overflow-hidden rounded-xl aspect-[4/3] cursor-pointer">
                    <img src="https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=800&q=80" alt="Modern Living" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6">
                        <div>
                            <p className="text-white font-bold text-lg">Modern Living Room</p>
                            <p className="text-white/80 text-sm">Featured: Eames Lounge Chair</p>
                        </div>
                    </div>
                </div>
                <div className="group relative overflow-hidden rounded-xl aspect-[4/3] cursor-pointer">
                    <img src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80" alt="Scandinavian Style" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6">
                        <div>
                            <p className="text-white font-bold text-lg">Scandinavian Office</p>
                            <p className="text-white/80 text-sm">Featured: Minimalist Desk</p>
                        </div>
                    </div>
                </div>
                <div className="group relative overflow-hidden rounded-xl aspect-[4/3] cursor-pointer">
                    <img src="https://images.unsplash.com/photo-1505693416388-b0346efee958?auto=format&fit=crop&w=800&q=80" alt="Industrial Loft" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6">
                        <div>
                            <p className="text-white font-bold text-lg">Industrial Loft</p>
                            <p className="text-white/80 text-sm">Featured: Metal Coffee Table</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
