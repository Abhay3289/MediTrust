import { useEffect, useState } from 'react';
import { Icon } from './Icons';

/** Auto-sliding "Verified Patient Experience" carousel — PRD Section 21. */
export function ReviewCarousel({ reviews = [], autoPlayMs = 6000 }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reviews.length <= 1) return undefined;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % reviews.length);
    }, autoPlayMs);
    return () => clearInterval(timer);
  }, [reviews.length, autoPlayMs]);

  if (reviews.length === 0) return null;

  const goTo = (i) => setIndex(((i % reviews.length) + reviews.length) % reviews.length);
  const review = reviews[index];

  return (
    <div className="review-carousel">
      <div className="review-carousel-track">
        <button
          type="button"
          className="review-carousel-arrow prev"
          onClick={() => goTo(index - 1)}
          aria-label="Previous review"
        >
          <Icon name="arrow-right" size={16} className="rotate-180" />
        </button>

        <div className="review-carousel-slide">
          <div className="review-carousel-stars">
            {[...Array(review.rating)].map((_, i) => (
              <Icon key={i} name="star" size={16} />
            ))}
          </div>
          <p className="review-carousel-quote">“{review.comment}”</p>
          <div className="review-carousel-author-row">
            <div className="author-avatar">{review.author.charAt(0)}</div>
            <div>
              <strong className="author-name">{review.author}</strong>
              <span className="author-role">
                {review.date} • <span className="verified-inline"><Icon name="badge-check" size={12} /> Verified Consultation</span>
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="review-carousel-arrow next"
          onClick={() => goTo(index + 1)}
          aria-label="Next review"
        >
          <Icon name="arrow-right" size={16} />
        </button>
      </div>

      {reviews.length > 1 && (
        <div className="review-carousel-dots">
          {reviews.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`review-carousel-dot ${i === index ? 'active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Go to review ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
