import { useState } from 'react';
import { Icon } from '../components/Icons';
import { HospitalSkyline } from '../components/HospitalSkyline';
import { customerHelpFaqs } from '../data/healthcareData';

export function CustomerHelpPage({ onNavigate }) {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const guideCards = [
    {
      step: '01',
      title: 'How to Search for Hospitals',
      description:
        'Type the hospital name, town, or specialty into the homepage search bar to browse accredited hospitals near you with live distance calculations.',
      actionLabel: 'Try Hospital Search',
      actionRoute: 'home',
    },
    {
      step: '02',
      title: 'How to Search by Location & Near Me',
      description:
        'Click "Near Me" to activate GPS location detection. MediTrust immediately calculates driving distances and sorts closest facilities first.',
      actionLabel: 'View Map Results',
      actionRoute: 'results',
    },
    {
      step: '03',
      title: 'How to Search by Disease or Treatment',
      description:
        'If you are unsure which hospital to choose, enter your specific condition (e.g., chest pain, fracture, child fever). We match hospitals equipped with those departments.',
      actionLabel: 'Enter Health Problem',
      actionRoute: 'health-problem',
    },
    {
      step: '04',
      title: 'How Hospital Recommendations Work',
      description:
        'Hospitals are recommended based on verified accreditation, specialized equipment (like Cath Labs, 24/7 ICUs, MRI suites), and real patient feedback.',
      actionLabel: 'Explore Hospitals',
      actionRoute: 'results',
    },
    {
      step: '05',
      title: 'How to View Hospital Details & Read Reviews',
      description:
        'Click "View Details" on any hospital card to inspect the full list of accredited departments, facilities, 24/7 ER wait times, and verified patient reviews.',
      actionLabel: 'See Hospital Details',
      actionRoute: 'results',
    },
    {
      step: '06',
      title: 'How to Use Online Doctor Consultation',
      description:
        'Need to speak with a physician from home? Click "Online Consultation" in the top navbar to search certified doctors and book a secure video consultation.',
      actionLabel: 'Online Consultation',
      actionRoute: 'consultation',
    },
  ];

  return (
    <div className="help-page-wrapper">
      {/* Hero */}
      <section className="help-hero-section">
        <HospitalSkyline tone="light" className="hero-skyline-backdrop" />
        <div className="container">
          <div className="help-hero-content">
            <div className="section-pill">
              <Icon name="help" size={14} />
              <span>Customer Support & Platform Guide</span>
            </div>

            <h1 className="help-hero-title">Help for MediTrust Customers</h1>
            <p className="help-hero-subtitle">
              Learn how to easily find accredited hospitals, check real-time emergency wait times, 
              match symptoms to specialized facilities, and book consultations.
            </p>
          </div>
        </div>
      </section>

      {/* Step-by-Step Customer Guides */}
      <section className="help-guides-section">
        <div className="container">
          <div className="section-header">
            <div className="section-pill">
              <Icon name="badge-check" size={14} />
              <span>Step-by-Step Guide</span>
            </div>
            <h2 className="section-title">Navigating MediTrust with Ease</h2>
            <p className="section-subtitle">
              Quick walkthroughs designed to help first-time visitors find the care they need without confusion.
            </p>
          </div>

          <div className="help-guides-grid">
            {guideCards.map((guide, idx) => (
              <div key={idx} className="help-guide-card">
                <span className="guide-step-number">{guide.step}</span>
                <h3 className="guide-title">{guide.title}</h3>
                <p className="guide-desc">{guide.description}</p>
                <button
                  type="button"
                  className="guide-action-link"
                  onClick={() => onNavigate(guide.actionRoute)}
                >
                  <span>{guide.actionLabel}</span>
                  <Icon name="arrow-right" size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="help-faqs-section">
        <div className="container">
          <div className="section-header center">
            <div className="section-pill">
              <Icon name="help" size={14} />
              <span>Common Questions</span>
            </div>
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-subtitle">
              Clear answers to the most common customer questions about our hospital discovery service.
            </p>
          </div>

          <div className="faqs-accordion-list">
            {customerHelpFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className={`faq-accordion-item ${isOpen ? 'expanded' : ''}`}
                >
                  <button
                    type="button"
                    className="faq-question-btn"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <Icon
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#4f46e5"
                    />
                  </button>

                  {isOpen && (
                    <div className="faq-answer-content">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Emergency & Support Contact Callout */}
      <section className="help-support-contact">
        <div className="container">
          <div className="support-contact-box">
            <div className="contact-box-left">
              <h3>Still need assistance or have a question?</h3>
              <p>
                Our patient advocacy and customer care team is available 24/7 to guide you to the nearest hospital 
                or answer questions regarding your appointment.
              </p>
              <div className="support-phones-row">
                <div className="support-phone-badge">
                  <Icon name="phone" size={16} color="#4f46e5" />
                  <span>Helpline: <strong>(800) 555-0199</strong> (24/7 Toll-Free)</span>
                </div>
                <div className="support-phone-badge">
                  <Icon name="mail" size={16} color="#0d9488" />
                  <span>Email: <strong>support@meditrust-health.org</strong></span>
                </div>
              </div>
            </div>

            <div className="contact-box-right">
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={() => onNavigate('home')}
              >
                <Icon name="search" size={18} />
                <span>Start Hospital Search</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
