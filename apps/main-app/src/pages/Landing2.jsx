import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Heart, CheckCircle, Sparkles, Gift } from 'lucide-react';

export default function Landing2() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Calendar,
      title: 'Plan Your Timeline',
      description: 'Organize every detail with our intuitive planning tools',
      color: '#FFF4E6',
      accentColor: '#D4A574',
    },
    {
      icon: Users,
      title: 'Manage Guests',
      description: 'Track RSVPs and seating arrangements effortlessly',
      color: '#FCE4EC',
      accentColor: '#C97C8F',
    },
    {
      icon: Heart,
      title: 'Find Vendors',
      description: 'Connect with trusted wedding professionals',
      color: '#E8F5E9',
      accentColor: '#4A9B5F',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah & Michael',
      text: 'Planning our wedding was stress-free thanks to this amazing platform!',
      color: '#FFF4E6',
    },
    {
      name: 'Emma & David',
      text: 'Every detail perfectly organized. Our dream wedding came true!',
      color: '#FCE4EC',
    },
    {
      name: 'Lisa & James',
      text: 'The best investment we made for our big day. Highly recommend!',
      color: '#E8F5E9',
    },
  ];

  return (
    <div style={{ backgroundColor: '#FFFBF7', minHeight: '100vh' }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="rounded-b-3xl mx-4 mt-4 mb-8"
          style={{
            background: 'linear-gradient(135deg, #F5E6D3 0%, #E8D5C4 100%)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        >
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 style={{
                  fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
                  fontSize: '48px',
                  fontWeight: 400,
                  color: '#2D3748',
                  marginBottom: '16px',
                  letterSpacing: '-0.02em',
                  lineHeight: '1.15',
                }}>
                  Your Dream Wedding,<br />Beautifully Planned
                </h1>
                <p style={{
                  fontFamily: "'DM Sans', 'Inter', sans-serif",
                  fontSize: '18px',
                  color: '#718096',
                  marginBottom: '32px',
                  lineHeight: '1.6',
                }}>
                  From the first "yes" to the last dance, we're with you every step of the way. 
                  Plan, organize, and celebrate your perfect day.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => navigate('/registro')}
                    style={{
                      backgroundColor: '#5EBBFF',
                      color: '#FFFFFF',
                      padding: '14px 32px',
                      borderRadius: '14px',
                      fontFamily: "'DM Sans', 'Inter', sans-serif",
                      fontSize: '16px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(94, 187, 255, 0.3)',
                      transition: 'all 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45AFFF'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#5EBBFF'}
                  >
                    Start Planning
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    style={{
                      backgroundColor: '#FFFFFF',
                      color: '#2D3748',
                      padding: '14px 32px',
                      borderRadius: '14px',
                      fontFamily: "'DM Sans', 'Inter', sans-serif",
                      fontSize: '16px',
                      fontWeight: 600,
                      border: '1px solid #E5E7EB',
                      cursor: 'pointer',
                      transition: 'all 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F9FAFB';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    Sign In
                  </button>
                </div>
              </div>
              <div className="relative">
                <div 
                  className="rounded-2xl overflow-hidden"
                  style={{ boxShadow: '0 16px 40px rgba(0,0,0,0.12)' }}
                >
                  <img 
                    src="https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80"
                    alt="Wedding celebration"
                    className="w-full h-auto"
                    onError={(e) => {
                      e.target.src = "https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800";
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 style={{
            fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
            fontSize: '36px',
            fontWeight: 400,
            color: '#2D3748',
            marginBottom: '12px',
            letterSpacing: '-0.01em',
          }}>
            Everything You Need
          </h2>
          <p style={{
            fontFamily: "'DM Sans', 'Inter', sans-serif",
            fontSize: '16px',
            color: '#718096',
          }}>
            Powerful tools designed for modern couples
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              style={{
                backgroundColor: feature.color,
                borderRadius: '20px',
                padding: '32px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: '1px solid #EEF2F7',
                transition: 'all 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
              }}
            >
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: feature.accentColor }}
              >
                <feature.icon className="w-7 h-7 text-white" strokeWidth={1.5} />
              </div>
              <h3 style={{
                fontFamily: "'DM Sans', 'Inter', sans-serif",
                fontSize: '20px',
                fontWeight: 600,
                color: '#2D3748',
                marginBottom: '8px',
              }}>
                {feature.title}
              </h3>
              <p style={{
                fontFamily: "'DM Sans', 'Inter', sans-serif",
                fontSize: '14px',
                color: '#718096',
                lineHeight: '1.6',
              }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 style={{
              fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
              fontSize: '36px',
              fontWeight: 400,
              color: '#2D3748',
              marginBottom: '16px',
              letterSpacing: '-0.01em',
            }}>
              Why Couples Love Us
            </h2>
            <div className="space-y-4">
              {[
                'Intuitive and easy to use',
                'Beautiful, modern interface',
                'Collaborate with your partner',
                'Everything in one place',
                'Access from any device',
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: '#66BB6A' }}
                  >
                    <CheckCircle className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                  <p style={{
                    fontFamily: "'DM Sans', 'Inter', sans-serif",
                    fontSize: '16px',
                    color: '#2D3748',
                    fontWeight: 500,
                  }}>
                    {benefit}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div 
            className="rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
          >
            <img 
              src="https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&auto=format&fit=crop&q=80"
              alt="Happy couple planning"
              className="w-full h-auto"
              onError={(e) => {
                e.target.src = "https://images.pexels.com/photos/2253842/pexels-photo-2253842.jpeg?auto=compress&cs=tinysrgb&w=800";
              }}
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 style={{
            fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
            fontSize: '36px',
            fontWeight: 400,
            color: '#2D3748',
            marginBottom: '12px',
            letterSpacing: '-0.01em',
          }}>
            Love Stories
          </h2>
          <p style={{
            fontFamily: "'DM Sans', 'Inter', sans-serif",
            fontSize: '16px',
            color: '#718096',
          }}>
            What our couples say
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              style={{
                backgroundColor: testimonial.color,
                borderRadius: '20px',
                padding: '28px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: '1px solid #EEF2F7',
              }}
            >
              <Heart className="w-6 h-6 mb-4" style={{ color: '#F8A5B7', fill: '#F8A5B7' }} />
              <p style={{
                fontFamily: "'DM Sans', 'Inter', sans-serif",
                fontSize: '15px',
                color: '#2D3748',
                lineHeight: '1.6',
                marginBottom: '16px',
              }}>
                "{testimonial.text}"
              </p>
              <p style={{
                fontFamily: "'DM Sans', 'Inter', sans-serif",
                fontSize: '14px',
                fontWeight: 600,
                color: '#718096',
              }}>
                {testimonial.name}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div 
          className="rounded-3xl text-center"
          style={{
            background: 'linear-gradient(135deg, #F5E6D3 0%, #E8D5C4 100%)',
            padding: '64px 48px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          }}
        >
          <Sparkles className="w-12 h-12 mx-auto mb-6" style={{ color: '#D4A574' }} />
          <h2 style={{
            fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
            fontSize: '40px',
            fontWeight: 400,
            color: '#2D3748',
            marginBottom: '16px',
            letterSpacing: '-0.01em',
          }}>
            Start Planning Today
          </h2>
          <p style={{
            fontFamily: "'DM Sans', 'Inter', sans-serif",
            fontSize: '18px',
            color: '#718096',
            marginBottom: '32px',
          }}>
            Join thousands of couples creating their perfect wedding
          </p>
          <button
            onClick={() => navigate('/registro')}
            style={{
              backgroundColor: '#5EBBFF',
              color: '#FFFFFF',
              padding: '16px 40px',
              borderRadius: '14px',
              fontFamily: "'DM Sans', 'Inter', sans-serif",
              fontSize: '18px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(94, 187, 255, 0.3)',
              transition: 'all 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#45AFFF';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#5EBBFF';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer 
        className="border-t mx-6 py-8"
        style={{ borderColor: '#E5E7EB' }}
      >
        <div className="max-w-6xl mx-auto text-center">
          <p style={{
            fontFamily: "'DM Sans', 'Inter', sans-serif",
            fontSize: '14px',
            color: '#718096',
          }}>
            © 2025 Wedding Planner. Making dream weddings come true.
          </p>
        </div>
      </footer>
    </div>
  );
}
