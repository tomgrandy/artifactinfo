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
      const onceWithDocument = $(once('counter-animation', '#artifact-counter', document));
      const onceWithoutContext = $(once('counter-animation', '#artifact-counter'));
      let workingOnce = onceWithDocument.length > 0 ? onceWithDocument : onceWithoutContext;
      if (workingOnce.length === 0) {
        const manualElement = document.getElementById('artifact-counter');
        if (manualElement && !manualElement.hasAttribute('data-once-counter-animation')) {
          manualElement.setAttribute('data-once-counter-animation', 'true');
          workingOnce = $(manualElement);
        }
      }

      workingOnce.each(function() {
        const counter = this;
        const targetAttribute = counter.getAttribute('data-target');
        const artifactCount = targetAttribute ? parseInt(targetAttribute, 10) : (settings.artifactinfo.artifactCount);
        counter.textContent = '0';
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

  Drupal.behaviors.artifactImageCounter = {
    attach: function (context, settings) {
      const onceWithDocument = $(once('counter-animation', '#image-counter', document));
      const onceWithoutContext = $(once('counter-animation', '#image-counter'));
      let workingOnce = onceWithDocument.length > 0 ? onceWithDocument : onceWithoutContext;
      if (workingOnce.length === 0) {
        const manualElement = document.getElementById('image-counter');
        if (manualElement && !manualElement.hasAttribute('data-once-counter-animation')) {
          manualElement.setAttribute('data-once-counter-animation', 'true');
          workingOnce = $(manualElement);
        }
      }

      workingOnce.each(function() {
        const counter = this;
        const targetAttribute = counter.getAttribute('data-target');
        const artifactImageCount = targetAttribute ? parseInt(targetAttribute, 10) : (settings.artifactinfo.totalImageCount);
        counter.textContent = '0';
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
          animateCounter(counter, artifactImageCount, 2000);
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

  /**
   * Filter and Sort functionality behavior.
   */
  Drupal.behaviors.filterSortBehavior = {
    attach: function (context, settings) {

      // Initialize filter sidebar functionality
      once('filter-sidebar', '#filter-btn', context).forEach(function (element) {
        const filterBtn = element;
        const sortBtn = document.getElementById('sort-btn');
        const searchFilters = document.getElementById('search-filters');
        const filterClose = document.getElementById('filter-close');
        const sidebarOverlay = document.getElementById('sidebar-overlay');

        // Only proceed if all required elements exist
        if (!filterBtn || !searchFilters || !filterClose || !sidebarOverlay) {
          return;
        }

        /**
         * Close filter sidebar function
         */
        function closeFilters() {
          searchFilters.classList.remove('active');
          sidebarOverlay.classList.remove('active');
          document.body.style.overflow = 'auto';
        }

        // Mobile filter sidebar toggle
        filterBtn.addEventListener('click', function (e) {
          e.preventDefault();
          searchFilters.classList.add('active');
          sidebarOverlay.classList.add('active');
          document.body.style.overflow = 'hidden';
        });

        // Close filter sidebar
        filterClose.addEventListener('click', function (e) {
          e.preventDefault();
          closeFilters();
        });

        sidebarOverlay.addEventListener('click', function (e) {
          e.preventDefault();
          closeFilters();
        });

        // Handle window resize
        function handleResize() {
          if (window.innerWidth > 768) {
            closeFilters();
          }
        }

        window.addEventListener('resize', handleResize);

        // Store reference for potential cleanup
        element.closeFilters = closeFilters;
        element.handleResize = handleResize;
      });

      // Touch scroll prevention - only attach once per page
      once('touch-scroll-prevention', 'body', context).forEach(function () {
        function preventScroll(e) {
          const searchFilters = document.getElementById('search-filters');
          if (searchFilters && searchFilters.classList.contains('active')) {
            if (!searchFilters.contains(e.target)) {
              e.preventDefault();
            }
          }
        }

        document.addEventListener('touchmove', preventScroll, { passive: false });

        // Store reference for potential cleanup
        document.body.preventScroll = preventScroll;
      });
    },

    detach: function (context, settings, trigger) {
      // Cleanup when behavior is detached
      if (trigger === 'unload') {
        // Remove event listeners and cleanup
        const preventScroll = document.body.preventScroll;
        if (preventScroll) {
          document.removeEventListener('touchmove', preventScroll);
          delete document.body.preventScroll;
        }

        // Remove any existing sort menus
        const existingSortMenu = document.querySelector('.sort-menu');
        if (existingSortMenu) {
          document.body.removeChild(existingSortMenu);
        }

        // Clean up window resize listeners
        const filterBtns = context.querySelectorAll('#filter-btn');
        filterBtns.forEach(function (btn) {
          if (btn.handleResize) {
            window.removeEventListener('resize', btn.handleResize);
            delete btn.handleResize;
          }
        });
      }
    }
  };

    /**
   * Artifact Image Gallery and Lightbox behavior.
   */
  Drupal.behaviors.artifactImageGallery = {
    attach: function (context, settings) {

      // Make changeImage function globally available immediately
      if (!window.changeImage) {
        window.changeImage = function(thumbnail, imageSrc) {

          // Try multiple selectors to find the main image
          let mainImage = document.getElementById('mainImage');
          if (!mainImage) {
            mainImage = document.querySelector('.main-image');
          }
          if (!mainImage) {
            mainImage = document.querySelector('.main-image-container img');
          }

          if (mainImage && imageSrc) {
            // Update the main image source
            mainImage.src = imageSrc;
            
            // Update data-magnify-src attribute for magnify plugin
            // Use the same image URL for magnification (or get from thumbnail data attribute)
            let magnifyImageSrc = imageSrc;
            if (thumbnail && thumbnail.getAttribute('data-magnify-src')) {
              magnifyImageSrc = thumbnail.getAttribute('data-magnify-src');
            }
            mainImage.setAttribute('data-magnify-src', magnifyImageSrc);
            
            // Reinitialize magnify plugin for the updated image (desktop only)
            if (jQuery && jQuery.fn.magnify) {
              const isMobile = window.matchMedia('(max-width: 768px)').matches || 
                              'ontouchstart' in window || 
                              navigator.maxTouchPoints > 0;
              
              if (!isMobile) {
                const $mainImage = jQuery(mainImage);
                // Destroy existing magnify instance
                if ($mainImage.closest('.magnify').length) {
                  $mainImage.magnify('destroy');
                }
                // Reinitialize magnify with new image
                $mainImage.magnify({
                  speed: 200,
                  timeout: -1
                });
              } else {
                // On mobile, ensure proper styling
                jQuery(mainImage).css({
                  'cursor': 'default',
                  'max-width': '100%',
                  'height': 'auto'
                });
              }
            }

            // Update active thumbnail
            const thumbnails = document.querySelectorAll('.thumbnail');
            thumbnails.forEach(thumb => thumb.classList.remove('active'));
            if (thumbnail && thumbnail.classList) {
              thumbnail.classList.add('active');
            }
          } else {
            console.warn('Main image not found or no image source provided');
          }
        };
      }

      // Initialize image gallery functionality
      $(once('artifact-gallery', '.artifact-details', context)).each(function() {
        const artifactContainer = this;
        const mainImage = artifactContainer.querySelector('#mainImage');
        const thumbnails = artifactContainer.querySelectorAll('.thumbnail');
        const thumbnailSlider = artifactContainer.querySelector('.thumbnail-slider');

        if (!mainImage || !thumbnails.length) {
          return;
        }

        // Add click handlers to thumbnails
        thumbnails.forEach(function(thumbnail) {
          thumbnail.addEventListener('click', function(e) {
            e.preventDefault();
            const imageSrc = this.getAttribute('data-full-image') || this.src;
            window.changeImage(this, imageSrc);
          });
        });

        // Initialize thumbnail slider scroll functionality
        if (thumbnailSlider) {
          // Check if mobile
          const isMobile = window.matchMedia('(max-width: 768px)').matches || 
                          'ontouchstart' in window || 
                          navigator.maxTouchPoints > 0;
          
          if (!isMobile) {
            // Desktop: Enable drag scrolling
            let isDown = false;
            let startX;
            let scrollLeft;

            // Mouse events for desktop
            thumbnailSlider.addEventListener('mousedown', function(e) {
              isDown = true;
              this.style.cursor = 'grabbing';
              startX = e.pageX - this.offsetLeft;
              scrollLeft = this.scrollLeft;
            });

            thumbnailSlider.addEventListener('mouseleave', function() {
              isDown = false;
              this.style.cursor = 'grab';
            });

            thumbnailSlider.addEventListener('mouseup', function() {
              isDown = false;
              this.style.cursor = 'grab';
            });

            thumbnailSlider.addEventListener('mousemove', function(e) {
              if (!isDown) return;
              e.preventDefault();
              const x = e.pageX - this.offsetLeft;
              const walk = (x - startX) * 2;
              this.scrollLeft = scrollLeft - walk;
            });

            // Initialize cursor style for desktop
            thumbnailSlider.style.cursor = 'grab';
          } else {
            // Mobile: Ensure proper mobile styles (thumbnails wrap instead of scroll)
            thumbnailSlider.style.cursor = 'default';
            thumbnailSlider.style.overflowX = 'visible';
          }
        }
      });

      // Initialize lightbox functionality
      $(once('artifact-lightbox', 'body', context)).each(function() {
        function openLightbox(imageSrc) {
          let lightbox = document.getElementById('lightbox');
          let lightboxImage;

          // Create lightbox if it doesn't exist
          if (!lightbox) {
            lightbox = document.createElement('div');
            lightbox.id = 'lightbox';
            lightbox.className = 'lightbox';

            const closeButton = document.createElement('span');
            closeButton.className = 'lightbox-close';
            closeButton.innerHTML = '&times;';
            closeButton.addEventListener('click', closeLightbox);

            lightboxImage = document.createElement('img');
            lightboxImage.id = 'lightboxImage';
            lightboxImage.className = 'lightbox-image';

            lightbox.appendChild(closeButton);
            lightbox.appendChild(lightboxImage);
            document.body.appendChild(lightbox);
          } else {
            lightboxImage = lightbox.querySelector('#lightboxImage');
          }

          if (lightboxImage && imageSrc) {
            lightboxImage.src = imageSrc;
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
          }
        }

        /**
         * Close lightbox function
         */
        function closeLightbox() {
          const lightbox = document.getElementById('lightbox');
          if (lightbox) {
            lightbox.classList.remove('active');
            document.body.style.overflow = 'auto';
          }
        }

        // Add click event to main image for lightbox
        const mainImage = document.getElementById('mainImage');
        if (mainImage) {
          mainImage.addEventListener('click', function() {
            openLightbox(this.src);
          });
        }

        // Close lightbox when clicking outside the image
        $(document).on('click', '#lightbox', function(e) {
          if (e.target === this) {
            closeLightbox();
          }
        });

        // Close lightbox with Escape key
        $(document).on('keydown', function(e) {
          if (e.key === 'Escape') {
            closeLightbox();
          }
        });

        // Store functions for potential cleanup
        this.openLightbox = openLightbox;
        this.closeLightbox = closeLightbox;
      });

      // Initialize corrections form functionality
      $(once('corrections-form', '#correctionsForm', context)).on('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(this);
        const name = formData.get('yourName');
        const corrections = formData.get('corrections');

        if (!name || !corrections) {
          alert('Please fill in all required fields.');
          return;
        }

        // Here you would typically send the data to your backend
        // For now, show a success message
        alert('Thank you, ' + name + '! Your corrections have been submitted for review.');

        // Reset form
        this.reset();
      });
    },

    detach: function (context, settings, trigger) {
      // Cleanup when behavior is detached
      if (trigger === 'unload') {
        // Remove global changeImage function
        if (window.changeImage) {
          delete window.changeImage;
        }

        // Remove lightbox from DOM if it exists
        const lightbox = document.getElementById('lightbox');
        if (lightbox) {
          document.body.removeChild(lightbox);
        }

        // Restore body overflow
        document.body.style.overflow = 'auto';
      }
    }
  };

  Drupal.behaviors.typeFilterCheckboxes = {
    attach(context) {
      once('type-filter-processed', '#views-exposed-form-learning-center-detail-page-1', context).forEach((formElement) => {
        const actionsDiv = formElement.querySelector('#edit-actions--2');

        // Add checkboxes if they don't exist
        if (actionsDiv && !formElement.querySelector('.type-filter-wrapper')) {

          // Create wrapper div with checkboxes
          const wrapper = document.createElement('div');
          wrapper.className = 'type-filter-wrapper';
          wrapper.innerHTML = `
            <input type="checkbox" id="type-article" value="article"> Articles
            <input type="checkbox" id="type-videos" value="videos_for_learning_center"> Videos
          `;

          // Insert after actions div
          actionsDiv.insertAdjacentElement('afterend', wrapper);

          // Handle checkbox changes
          wrapper.addEventListener('change', function(e) {
            if (e.target.type === 'checkbox') {
              const url = new URL(window.location.href);
              
              // Remove existing type parameter
              url.searchParams.delete('type');
              
              // Get checked values
              const checkedValues = [];
              wrapper.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
                checkedValues.push(checkbox.value);
              });

              // Set appropriate type parameter based on selection
              if (checkedValues.length === 2) {
                // Both selected = type=all
                url.searchParams.set('type', 'all');
              } else if (checkedValues.length === 1) {
                // Only one selected = use specific type
                url.searchParams.set('type', checkedValues[0]);
              }
              // If none selected, no type parameter (let it be handled by backend)

              // Reload page with new URL
              window.location.href = url.toString();
            }
          });

          // Initialize checkboxes based on current URL or set default
          const currentUrl = new URL(window.location.href);
          const typeParam = currentUrl.searchParams.get('type');

          if (typeParam) {
            if (typeParam === 'all') {
              // Check both checkboxes
              wrapper.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = true;
              });
            } else {
              // Check specific checkbox
              const targetCheckbox = wrapper.querySelector(`input[value="${typeParam}"]`);
              if (targetCheckbox) {
                targetCheckbox.checked = true;
              }
            }
          } else {
            // Set default to all and reload
            currentUrl.searchParams.set('type', 'all');
            window.location.replace(currentUrl.toString());
          }
        }
      });
    }
  };

  Drupal.behaviors.puzzleSelector = {
    attach: function (context, settings) {
      // Get puzzle data from drupalSettings with fallback
      var puzzles = {};
      
      if (typeof drupalSettings !== 'undefined' && drupalSettings.puzzleSelector && drupalSettings.puzzleSelector.puzzles) {
        puzzles = drupalSettings.puzzleSelector.puzzles;
      }
      
      // Manual once implementation for dropdown
      $('.puzzle-selector-dropdown', context).each(function() {
        if ($(this).hasClass('puzzle-selector-processed')) {
          return; // Skip if already processed
        }
        $(this).addClass('puzzle-selector-processed');
        
        var $dropdown = $(this);
        
        // Function to load puzzle content
        function loadPuzzle(selectedNid) {
          var $displayArea = $('#puzzle-display-area');
          var $titleArea = $('#puzzle-title');
          var $wrapperArea = $('.puzzle-display-wrapper');
          
          if (!puzzles[selectedNid]) {
            console.warn('Puzzle not found for NID:', selectedNid);
            $displayArea.html('<p class="no-embed">Puzzle not found or no puzzle data available.</p>');
            $titleArea.html('');
            $wrapperArea.removeClass('has-content');
            return;
          }
          
          var puzzle = puzzles[selectedNid];
          
          // Update title
          $titleArea.html('<h3>' + puzzle.title + '</h3>');
          
          // Update embed code
          if (puzzle.embed_code && puzzle.embed_code.trim() !== '') {
            $displayArea.html(puzzle.embed_code);
            $wrapperArea.addClass('has-content');
          } else {
            $displayArea.html('<p class="no-embed">No embed code available for this puzzle.</p>');
            $wrapperArea.removeClass('has-content');
          }
          
          // Trigger a custom event for other scripts
          $(document).trigger('puzzleLoaded', [puzzle]);
        }
        
        // Handle dropdown change
        $dropdown.on('change', function() {
          var selectedNid = $(this).val();
          loadPuzzle(selectedNid);
        });
        
        // Auto-select first option and load it by default
        function initializeFirstPuzzle() {
          if ($dropdown.find('option').length > 0) {
            // Find first option (even if empty, then first non-empty)
            var firstOption = $dropdown.find('option').first();
            var firstNonEmptyOption = $dropdown.find('option[value!=""]').first();
            
            // Prefer non-empty option, fallback to first option
            var targetOption = firstNonEmptyOption.length ? firstNonEmptyOption : firstOption;
            
            if (targetOption.length && targetOption.val()) {
              $dropdown.val(targetOption.val());
              loadPuzzle(targetOption.val());
            } else {
              console.warn('No valid options found in dropdown');
            }
          } else {
            console.warn('No options found in dropdown');
          }
        }
        
        // Try to initialize immediately
        initializeFirstPuzzle();
        
        // Also try after a short delay in case DOM isn't fully ready
        setTimeout(function() {
          if ($('#puzzle-display-area').html().indexOf('Please select a puzzle') !== -1) {
            initializeFirstPuzzle();
          }
        }, 100);
      });
      
      // Manual once implementation for search
      $('.puzzle-search-input', context).each(function() {
        if ($(this).hasClass('puzzle-search-processed')) {
          return; // Skip if already processed
        }
        $(this).addClass('puzzle-search-processed');
        
        $(this).on('input', function() {
          var searchTerm = $(this).val().toLowerCase();
          var $dropdown = $('.puzzle-selector-dropdown');
          
          $dropdown.find('option').each(function() {
            var optionText = $(this).text().toLowerCase();
            var optionValue = $(this).val();
            
            if (optionValue === '' || optionText.includes(searchTerm)) {
              $(this).show();
            } else {
              $(this).hide();
            }
          });
        });
      });
    }
  };

  Drupal.behaviors.magnifyImages = {
    attach: function (context, settings) {
      // Enhanced mobile detection
      const isMobile = window.matchMedia('(max-width: 768px)').matches || 
                       'ontouchstart' in window || 
                       navigator.maxTouchPoints > 0;
      
      // Only initialize magnify on desktop devices
      if (!isMobile) {
        once('magnify', '.zoom', context).forEach(function(element) {
          $(element).magnify({
            speed: 200,
            timeout: -1
          });
        });
      } else {
        // On mobile, ensure images are properly styled
        once('mobile-images', '.zoom', context).forEach(function(element) {
          $(element).css({
            'cursor': 'default',
            'max-width': '100%',
            'height': 'auto'
          });
        });
      }
    }
  };

  Drupal.behaviors.facetsExpandCollapse = {
    attach: function (context, settings) {
      // Use context to scope selectors and once() to prevent duplicate bindings
      const expandArrows = once('facets-expand', '.expand-arrow', context);
      const allCheckboxes = once('facets-checkbox', '.facets-checkbox', context);
      const allLabels = once('facets-label', '.facet-item label', context);

      // Handle expand/collapse functionality - ONLY on arrow click
      $(expandArrows).on('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        
        const $parentItem = $(this).closest('.facet-item--expanded');
        const $childWidget = $parentItem.find('.facets-widget-');
        
        if ($parentItem.hasClass('collapsed')) {
          $parentItem.removeClass('collapsed');
          $childWidget.removeClass('collapsed');
        } else {
          $parentItem.addClass('collapsed');
          $childWidget.addClass('collapsed');
        }
      });

      // Prevent label clicks from expanding/collapsing
      $(allLabels).on('click', function(e) {
        // Only handle checkbox toggle, don't expand/collapse
        e.stopPropagation();
      });

      // Independent checkbox functionality - no parent-child relationship
      $(allCheckboxes).on('change', function(e) {
        e.stopPropagation();
        updateItemState($(this));
      });

      /**
       * Update visual state of facet items based on checkbox state.
       *
       * @param {jQuery} $checkbox
       *   The checkbox element that was changed.
       */
      function updateItemState($checkbox) {
        const $facetItem = $checkbox.closest('.facet-item');
        
        if ($checkbox.is(':checked')) {
          $facetItem.addClass('selected');
        } else {
          $facetItem.removeClass('selected');
        }
      }

      // Initialize states for all checkboxes in current context
      $(allCheckboxes).each(function() {
        updateItemState($(this));
      });
    }
  };

})(Drupal, jQuery, once);
