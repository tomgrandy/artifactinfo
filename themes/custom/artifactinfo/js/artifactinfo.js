/**
 * @file
 * Main JavaScript behaviors for Artifact Info theme.
 */

(function (Drupal, $, once) {
  'use strict';

  // Fallback for once function if not available
  if (typeof once === 'undefined') {
    console.warn('Drupal once library not loaded, using fallback');
    window.once = function(id, selector, context) {
      context = context || document;
      var elements = $(selector, context);
      return elements.filter(function() {
        if (this.hasAttribute('data-once-' + id)) {
          return false;
        }
        this.setAttribute('data-once-' + id, 'true');
        return true;
      });
    };
    // Update the once parameter for the fallback
    once = window.once;
  }

  /**
   * Mobile menu behavior.
   */
  Drupal.behaviors.artifactMobileMenu = {
    attach: function (context, settings) {
      // Toggle mobile menu
      $(once('mobile-menu-toggle', '.mobile-menu-toggle', context)).on('click', function(e) {
        e.preventDefault();
        const button = this;
        const mobileMenu = document.getElementById('mobile-menu');

        if (mobileMenu) {
          const isActive = mobileMenu.classList.contains('active');

          // Toggle active class
          mobileMenu.classList.toggle('active');

          // Update aria attributes
          button.setAttribute('aria-expanded', (!isActive).toString());
          mobileMenu.setAttribute('aria-hidden', isActive.toString());

          // Add body class to prevent scrolling when menu is open
          if (!isActive) {
            document.body.classList.add('mobile-menu-open');
          } else {
            document.body.classList.remove('mobile-menu-open');
          }
        }
      });

      // Close mobile menu when clicking outside
      $(document).on('click', function (event) {
        const mobileMenu = document.getElementById('mobile-menu');
        const toggleButton = document.querySelector('.mobile-menu-toggle');

        if (mobileMenu && toggleButton && mobileMenu.classList.contains('active')) {
          if (!mobileMenu.contains(event.target) && !toggleButton.contains(event.target)) {
            mobileMenu.classList.remove('active');
            toggleButton.setAttribute('aria-expanded', 'false');
            mobileMenu.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('mobile-menu-open');
          }
        }
      });

      // Close mobile menu when window is resized to desktop
      $(window).on('resize', function () {
        const mobileMenu = document.getElementById('mobile-menu');
        const toggleButton = document.querySelector('.mobile-menu-toggle');

        if (mobileMenu && toggleButton && window.innerWidth > 768) {
          mobileMenu.classList.remove('active');
          toggleButton.setAttribute('aria-expanded', 'false');
          mobileMenu.setAttribute('aria-hidden', 'true');
          document.body.classList.remove('mobile-menu-open');
        }
      });

      // Handle keyboard navigation for mobile menu
      $(once('mobile-menu-keyboard', '.mobile-menu-toggle', context)).on('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          $(this).trigger('click');
        }
      });
    }
  };

  /**
   * Smooth scrolling for navigation links behavior.
   */
  Drupal.behaviors.artifactSmoothScroll = {
    attach: function (context, settings) {
      $(once('smooth-scroll', 'a[href^="#"]', context)).on('click', function (e) {
        const href = this.getAttribute('href');

        // Skip if it's just a hash
        if (href === '#') {
          return;
        }

        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  };

  /**
   * Header scroll effect behavior.
   */
  Drupal.behaviors.artifactHeaderScroll = {
    attach: function (context, settings) {
      $(once('header-scroll', 'body', context)).each(function() {
        $(window).on('scroll', function () {
          const header = document.querySelector('.header');
          if (header) {
            if (window.scrollY > 50) {
              header.style.backgroundColor = 'rgba(56, 56, 59, 0.95)';
              header.style.backdropFilter = 'blur(15px)';
            } else {
              header.style.backgroundColor = 'transparent';
              header.style.backdropFilter = 'blur(10px)';
            }
          }
        });
      });
    }
  };

      /**
   * Counter animation behavior.
   */
  Drupal.behaviors.artifactCounter = {
    attach: function (context, settings) {
      // Try alternative approach for once function

      // Method 1: Try with document context
      const onceWithDocument = $(once('counter-animation', '#artifact-counter', document));

      // Method 2: Try without context
      const onceWithoutContext = $(once('counter-animation', '#artifact-counter'));

      // Use the working approach
      let workingOnce = onceWithDocument.length > 0 ? onceWithDocument : onceWithoutContext;

      if (workingOnce.length === 0) {
        // Manual once implementation
        const manualElement = document.getElementById('artifact-counter');
        if (manualElement && !manualElement.hasAttribute('data-once-counter-animation')) {
          manualElement.setAttribute('data-once-counter-animation', 'true');
          workingOnce = $(manualElement);
        }
      }

      workingOnce.each(function() {
        const counter = this;

        // Get count from data-target attribute first, then Drupal settings, then fallback
        const targetAttribute = counter.getAttribute('data-target');
        const artifactCount = targetAttribute
          ? parseInt(targetAttribute, 10)
          : (settings.artifactinfo && settings.artifactinfo.artifactCount
             ? settings.artifactinfo.artifactCount
             : 66173);

        // Clear the existing content and show 0 initially
        counter.textContent = '0';

        // Counter animation function
        function animateCounter(element, target, duration) {
          const start = 0;
          const startTime = performance.now();

          function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth animation
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (target - start) * easeOut);

            // Format number with commas
            element.textContent = current.toLocaleString();

            if (progress < 1) {
              requestAnimationFrame(update);
            } else {
              element.textContent = target.toLocaleString();
            }
          }

          requestAnimationFrame(update);
        }

        // Start animation after a short delay
        setTimeout(() => {
          animateCounter(counter, artifactCount, 2000);
        }, 500);
      });
    }
  };

  /**
   * Video functionality behavior.
   */
  Drupal.behaviors.artifactVideo = {
    attach: function (context, settings) {
      $(once('video-play-button', '.play-button', context)).on('click', function() {
        const videoContainer = document.getElementById('videoContainer');
        const videoPlaceholder = document.getElementById('videoPlaceholder');
        const videoLoading = document.getElementById('videoLoading');

        if (!videoContainer || !videoPlaceholder || !videoLoading) {
          return;
        }

        // Show loading
        videoPlaceholder.style.display = 'none';
        videoLoading.style.display = 'block';

        // Simulate loading delay (replace with actual video loading)
        setTimeout(() => {
          // Create iframe for video (replace with actual video URL)
          const iframe = document.createElement('iframe');
          iframe.className = 'video-iframe';
          iframe.src = 'https://www.youtube.com/embed/dQw4w9WgXcQ'; // Replace with actual video
          iframe.allowFullscreen = true;

          // Hide loading and add iframe
          videoLoading.style.display = 'none';
          videoContainer.appendChild(iframe);
        }, 1000);
      });
    }
  };

  /**
   * Events navigation behavior.
   */
  Drupal.behaviors.artifactEventsNavigation = {
    attach: function (context, settings) {
      function navigateToEvents() {
        // Replace with actual navigation
        // window.location.href = '/events';
      }

      $(once('events-navigation', '.upcoming-events-section', context)).each(function() {
        $(this).on('click', function() {
          navigateToEvents();
        });

        $(this).on('keydown', function(event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            navigateToEvents();
          }
        });
      });
    }
  };

  /**
   * Feature cards animation behavior.
   */
  Drupal.behaviors.artifactFeatureCards = {
    attach: function (context, settings) {
      // Add js class to body for progressive enhancement
      $('body').addClass('js');

      $(once('feature-cards-init', '.features-section', context)).each(function() {
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach((card, index) => {
          // Add a small delay to ensure styles are applied
          setTimeout(() => card.classList.add('animate-in'), 100 * (index + 1));
        });
      });
    }
  };

  /**
   * Newsletter signup behavior.
   */
  Drupal.behaviors.artifactNewsletter = {
    attach: function (context, settings) {
      $(once('newsletter-form', '.newsletter-form', context)).on('submit', function(event) {
        event.preventDefault();
        const email = event.target.querySelector('.newsletter-input').value;

        // Newsletter signup logic would go here

        // Here you would typically send the email to your backend
        // For now, just show a success message
        const button = event.target.querySelector('.newsletter-btn');
        const originalText = button.textContent;

        button.textContent = 'Subscribed!';
        button.style.backgroundColor = '#4CAF50';

        setTimeout(() => {
          button.textContent = originalText;
          button.style.backgroundColor = '#A8A6A1';
          event.target.reset();
        }, 2000);
      });
    }
  };

  /**
   * Initialize new sections animations behavior.
   */
  Drupal.behaviors.artifactSectionsAnimation = {
    attach: function (context, settings) {
      $(once('sections-animation', 'body', context)).each(function() {
        const sections = ['.get-started-content', '.video-container', '.upcoming-events-section'];

        sections.forEach(selector => {
          const element = document.querySelector(selector);
          if (element) {
            element.classList.add('animate-in');
          }
        });
      });
    }
  };

  /**
   * Intersection Observer for enhanced animations behavior.
   */
  Drupal.behaviors.artifactIntersectionObserver = {
    attach: function (context, settings) {
      $(once('intersection-observer', 'body', context)).each(function() {
        // Check if IntersectionObserver is supported
        if ('IntersectionObserver' in window) {
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
              }
            });
          }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
          });

          document.querySelectorAll('.feature-card').forEach(card => {
            observer.observe(card);
          });
        }
      });
    }
  };

  /**
   * Page load initialization behavior.
   */
  Drupal.behaviors.artifactPageLoad = {
    attach: function (context, settings) {
      $(once('page-load-init', 'body', context)).each(function() {
        // Add js class to body for progressive enhancement
        $('body').addClass('js');

        // Wait for page to be fully loaded
        $(window).on('load', function() {
          // Initialize feature cards animation
          const featureCards = document.querySelectorAll('.feature-card');
          featureCards.forEach((card, index) => {
            setTimeout(() => card.classList.add('animate-in'), 100 * index);
          });

          // Initialize new sections animations
          const sections = ['.get-started-content', '.video-container', '.upcoming-events-section'];
          sections.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
              element.classList.add('animate-in');
            }
          });
        });
      });
    }
  };

})(Drupal, jQuery, once);
