/**
 * @file
 * Artifact Auctions Theme JavaScript behaviors.
 */

(function ($, Drupal, once) {
  'use strict';

  /**
   * Mobile Menu Behavior
   */
  Drupal.behaviors.artifactMobileMenu = {
    attach: function (context, settings) {
      const $mobileMenuToggle = $(once('mobile-menu-toggle', '.mobile-menu-toggle', context));
      const $mobileMenu = $(once('mobile-menu', '.mobile-menu', context));

      if ($mobileMenuToggle.length && $mobileMenu.length) {
        // Toggle mobile menu
        $mobileMenuToggle.on('click.artifactMobileMenu', function(e) {
          e.preventDefault();
          Drupal.behaviors.artifactMobileMenu.toggleMobileMenu($mobileMenu, $(this));
        });

        // Close mobile menu when clicking outside
        $(document).on('click.artifactMobileMenu', function(event) {
          if (!$mobileMenu[0].contains(event.target) && !$mobileMenuToggle[0].contains(event.target)) {
            Drupal.behaviors.artifactMobileMenu.closeMobileMenu($mobileMenu, $mobileMenuToggle);
          }
        });

        // Close mobile menu when window is resized to desktop
        $(window).on('resize.artifactMobileMenu', function() {
          if (window.innerWidth > 768) {
            Drupal.behaviors.artifactMobileMenu.closeMobileMenu($mobileMenu, $mobileMenuToggle);
          }
        });

        // Close mobile menu when pressing Escape key
        $(document).on('keydown.artifactMobileMenu', function(event) {
          if (event.key === 'Escape' && $mobileMenu.hasClass('active')) {
            Drupal.behaviors.artifactMobileMenu.closeMobileMenu($mobileMenu, $mobileMenuToggle);
            $mobileMenuToggle.focus();
          }
        });
      }
    },

    toggleMobileMenu: function($mobileMenu, $toggle) {
      $mobileMenu.toggleClass('active');

      // Update ARIA attributes for accessibility
      const isOpen = $mobileMenu.hasClass('active');
      $toggle.attr('aria-expanded', isOpen);
      $mobileMenu.attr('aria-hidden', !isOpen);
    },

    closeMobileMenu: function($mobileMenu, $toggle) {
      $mobileMenu.removeClass('active');
      $toggle.attr('aria-expanded', 'false');
      $mobileMenu.attr('aria-hidden', 'true');
    },

    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        $(document).off('.artifactMobileMenu');
        $(window).off('.artifactMobileMenu');
      }
    }
  };

  /**
   * Smooth Scrolling Behavior
   */
  Drupal.behaviors.artifactSmoothScrolling = {
    attach: function (context, settings) {
      const $anchors = $(once('smooth-scroll', 'a[href^="#"]', context));

      $anchors.on('click.artifactSmoothScrolling', function(e) {
        const href = $(this).attr('href');

        // Skip empty anchors
        if (href === '#' || href === '#!') return;

        e.preventDefault();

        const $target = $(href);
        if ($target.length) {
          // Close mobile menu if open
          const $mobileMenu = $('.mobile-menu');
          const $mobileMenuToggle = $('.mobile-menu-toggle');
          if ($mobileMenu.hasClass('active')) {
            Drupal.behaviors.artifactMobileMenu.closeMobileMenu($mobileMenu, $mobileMenuToggle);
          }

          // Scroll to target with offset for fixed header
          const headerHeight = $('.header').outerHeight() || 80;
          const targetPosition = $target.offset().top - headerHeight;

          $('html, body').animate({
            scrollTop: targetPosition
          }, 600, function() {
            // Focus the target for accessibility
            $target.attr('tabindex', '-1').focus();
          });
        }
      });
    },

    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        $('a[href^="#"]', context).off('.artifactSmoothScrolling');
      }
    }
  };

  /**
   * Header Scroll Effect Behavior
   */
  Drupal.behaviors.artifactHeaderScroll = {
    attach: function (context, settings) {
      const $header = $(once('header-scroll', '.header', context));

      if ($header.length) {
        let lastScrollY = $(window).scrollTop();
        let ticking = false;

        function updateHeader() {
          const currentScrollY = $(window).scrollTop();

          if (currentScrollY > 50) {
            $header.addClass('scrolled').css({
              'background-color': 'rgba(56, 56, 59, 0.95)',
              'backdrop-filter': 'blur(15px)'
            });
          } else {
            $header.removeClass('scrolled').css({
              'background-color': 'transparent',
              'backdrop-filter': 'blur(10px)'
            });
          }

          lastScrollY = currentScrollY;
          ticking = false;
        }

        function requestTick() {
          if (!ticking) {
            requestAnimationFrame(updateHeader);
            ticking = true;
          }
        }

        $(window).on('scroll.artifactHeaderScroll', function() {
          requestTick();
        });
      }
    },

    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        $(window).off('.artifactHeaderScroll');
      }
    }
  };

  /**
   * Form Validation and Enhancement Behavior
   */
  Drupal.behaviors.artifactFormValidation = {
    attach: function (context, settings) {
      const $forms = $(once('form-validation', '.form', context));

      $forms.each(function() {
        const $form = $(this);
        const $inputs = $form.find('.form-input, .form-textarea, .form-select');

        // Add real-time validation
        $inputs.on('blur.artifactFormValidation', function() {
          Drupal.behaviors.artifactFormValidation.validateField($(this));
        });

        $inputs.on('input.artifactFormValidation', function() {
          if ($(this).hasClass('error')) {
            Drupal.behaviors.artifactFormValidation.validateField($(this));
          }
        });

        // Handle form submission
        $form.on('submit.artifactFormValidation', function(e) {
          if (!Drupal.behaviors.artifactFormValidation.validateForm($form)) {
            e.preventDefault();
          }
        });
      });

      // File upload enhancement
      Drupal.behaviors.artifactFormValidation.initializeFileUploads(context);
    },

    validateField: function($field) {
      const value = $field.val().trim();
      const isRequired = $field.prop('required');
      const type = $field.attr('type');
      const $group = $field.closest('.form-group');

      let isValid = true;
      let message = '';

      // Remove previous validation states
      $field.removeClass('error success');
      $group.find('.form-message.error').remove();

      // Required field validation
      if (isRequired && !value) {
        isValid = false;
        message = Drupal.t('This field is required.');
      }

      // Email validation
      if (type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          isValid = false;
          message = Drupal.t('Please enter a valid email address.');
        }
      }

      // Phone validation
      if (type === 'tel' && value) {
        const phoneRegex = /^[\+]?[\d\s\-\(\)]+$/;
        if (!phoneRegex.test(value) || value.replace(/\D/g, '').length < 10) {
          isValid = false;
          message = Drupal.t('Please enter a valid phone number.');
        }
      }

      // Update field state
      if (!isValid) {
        $field.addClass('error');
        if ($group.length && message) {
          $group.append('<div class="form-message error">' + message + '</div>');
        }
      } else if (value) {
        $field.addClass('success');
      }

      return isValid;
    },

    validateForm: function($form) {
      const $fields = $form.find('.form-input, .form-textarea, .form-select');
      let isValid = true;

      $fields.each(function() {
        if (!Drupal.behaviors.artifactFormValidation.validateField($(this))) {
          isValid = false;
        }
      });

      return isValid;
    },

    initializeFileUploads: function(context) {
      const $fileInputs = $(once('file-upload', '.form-file input[type="file"]', context));

      $fileInputs.on('change.artifactFormValidation', function() {
        const $label = $(this).parent().find('.form-file-label');
        const files = this.files;

        if (files.length > 0) {
          const fileName = files.length === 1 ? files[0].name : Drupal.formatPlural(files.length, '1 file selected', '@count files selected');
          $label.text(fileName).addClass('has-file');
        } else {
          $label.text(Drupal.t('Choose file...')).removeClass('has-file');
        }
      });
    },

    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        $('.form', context).off('.artifactFormValidation');
        $('.form-input, .form-textarea, .form-select', context).off('.artifactFormValidation');
        $('.form-file input[type="file"]', context).off('.artifactFormValidation');
      }
    }
  };

  /**
   * Accessibility Enhancements Behavior
   */
  Drupal.behaviors.artifactAccessibility = {
    attach: function (context, settings) {
      // Add keyboard navigation for custom elements
      const $clickableElements = $(once('keyboard-nav', '[onclick], .btn, .card', context));

      $clickableElements.each(function() {
        const $element = $(this);

        if (!$element.attr('tabindex')) {
          $element.attr('tabindex', '0');
        }

        $element.on('keydown.artifactAccessibility', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.click();
          }
        });
      });

      // Add ARIA labels where needed
      const $mobileToggle = $(once('mobile-toggle-aria', '.mobile-menu-toggle', context));
      if ($mobileToggle.length) {
        $mobileToggle.attr({
          'aria-label': Drupal.t('Toggle mobile menu'),
          'aria-expanded': 'false'
        });
      }

      const $mobileMenu = $(once('mobile-menu-aria', '.mobile-menu', context));
      if ($mobileMenu.length) {
        $mobileMenu.attr('aria-hidden', 'true');
      }
    },

    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        $('[onclick], .btn, .card', context).off('.artifactAccessibility');
      }
    }
  };

  /**
   * Modal Functionality Behavior
   */
  Drupal.behaviors.artifactModal = {
    attach: function (context, settings) {
      // Modal triggers
      const $modalTriggers = $(once('modal-trigger', '[data-modal-target]', context));
      $modalTriggers.on('click.artifactModal', function(e) {
        e.preventDefault();
        const modalId = $(this).data('modal-target');
        Drupal.behaviors.artifactModal.openModal(modalId);
      });

      // Modal close buttons
      const $modalCloses = $(once('modal-close', '.modal-close', context));
      $modalCloses.on('click.artifactModal', function(e) {
        e.preventDefault();
        const $modal = $(this).closest('.modal-overlay');
        if ($modal.length) {
          Drupal.behaviors.artifactModal.closeModal($modal.attr('id'));
        }
      });

      // Modal overlay clicks
      const $modalOverlays = $(once('modal-overlay', '.modal-overlay', context));
      $modalOverlays.on('click.artifactModal', function(e) {
        if (e.target === this) {
          Drupal.behaviors.artifactModal.closeModal($(this).attr('id'));
        }
      });

      // Escape key handling
      $(document).on('keydown.artifactModal', function(e) {
        if (e.key === 'Escape') {
          const $openModal = $('.modal-overlay:visible');
          if ($openModal.length) {
            Drupal.behaviors.artifactModal.closeModal($openModal.attr('id'));
          }
        }
      });
    },

    openModal: function(modalId) {
      const $modal = $('#' + modalId);
      if ($modal.length) {
        $modal.show().attr('aria-hidden', 'false');
        $('body').css('overflow', 'hidden');

        // Focus the modal for accessibility
        const $firstFocusable = $modal.find('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').first();
        if ($firstFocusable.length) {
          $firstFocusable.focus();
        }

        // Trigger custom event
        $(document).trigger('modalOpened', [modalId]);
      }
    },

    closeModal: function(modalId) {
      const $modal = $('#' + modalId);
      if ($modal.length) {
        $modal.hide().attr('aria-hidden', 'true');
        $('body').css('overflow', '');

        // Trigger custom event
        $(document).trigger('modalClosed', [modalId]);
      }
    },

    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        $('[data-modal-target]', context).off('.artifactModal');
        $('.modal-close', context).off('.artifactModal');
        $('.modal-overlay', context).off('.artifactModal');
        $(document).off('.artifactModal');
      }
    }
  };

  /**
   * Utility Functions
   */
  Drupal.ArtifactTheme = Drupal.ArtifactTheme || {};

  /**
   * Debounce function for performance optimization.
   */
  Drupal.ArtifactTheme.debounce = function(func, wait) {
    let timeout;
    return function executedFunction() {
      const context = this;
      const args = arguments;
      const later = function() {
        clearTimeout(timeout);
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  /**
   * Throttle function for performance optimization.
   */
  Drupal.ArtifactTheme.throttle = function(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(function() {
          inThrottle = false;
        }, limit);
      }
    };
  };

  /**
   * Global API for external use
   */
  Drupal.ArtifactTheme.openModal = function(modalId) {
    return Drupal.behaviors.artifactModal.openModal(modalId);
  };

  Drupal.ArtifactTheme.closeModal = function(modalId) {
    return Drupal.behaviors.artifactModal.closeModal(modalId);
  };

  Drupal.ArtifactTheme.toggleMobileMenu = function() {
    const $mobileMenu = $('.mobile-menu');
    const $mobileMenuToggle = $('.mobile-menu-toggle');
    return Drupal.behaviors.artifactMobileMenu.toggleMobileMenu($mobileMenu, $mobileMenuToggle);
  };

  Drupal.ArtifactTheme.validateForm = function(formSelector) {
    const $form = $(formSelector);
    return Drupal.behaviors.artifactFormValidation.validateForm($form);
  };

})(jQuery, Drupal, once);
