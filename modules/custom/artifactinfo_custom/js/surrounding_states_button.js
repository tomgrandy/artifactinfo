(function ($, Drupal, once) {
  'use strict';

  /**
   * Surrounding states button functionality.
   */
  Drupal.behaviors.surroundingStatesButton = {
    attach: function (context, settings) {
      const buttons = once('surrounding-states-init', '#surrounding-states-btn', context);
      
      if (buttons.length === 0) {
        return;
      }

      buttons.forEach(function(button) {
        const $button = $(button);
        
        $button.on('click', function(e) {
          e.preventDefault();
          
          const isIncludeMode = $button.hasClass('include-mode') || !$button.hasClass('remove-mode');
          
          if (isIncludeMode) {
            handleIncludeSurroundingStates($button);
          } else {
            handleRemoveSurroundingStates($button);
          }
        });

        // Initialize button state on page load
        initializeButtonState($button);
        
        // Update button visibility when facet checkboxes change
        const $facetContainer = $button.closest('.facets-widget-checkbox');
        if ($facetContainer.length) {
          $facetContainer.on('change', 'input[type="checkbox"]', function() {
            // Use setTimeout to allow URL to update first
            setTimeout(function() {
              updateButtonVisibility($button);
            }, 100);
          });
        }
        
        // Also listen for facet link clicks (for non-checkbox facets)
        $facetContainer.on('click', 'a.facet-item__link', function() {
          setTimeout(function() {
            updateButtonVisibility($button);
          }, 100);
        });
        
        // Listen for browser back/forward navigation
        $(window).on('popstate', function() {
          setTimeout(function() {
            initializeButtonState($button);
          }, 100);
        });
      });
    }
  };

  /**
   * Initialize button state based on current URL parameters.
   */
  function initializeButtonState($button) {
    const urlParams = new URLSearchParams(window.location.search);
    const surroundingStatesPresent = hasSurroundingStatesInUrl(urlParams);
    
    if (surroundingStatesPresent) {
      setButtonToRemoveMode($button);
    } else {
      setButtonToIncludeMode($button);
    }
    
    // Update visibility based on selected terms
    updateButtonVisibility($button);
  }

  /**
   * Update button visibility based on selected terms.
   */
  function updateButtonVisibility($button) {
    const selectedTermIds = getSelectedTermIds();
    
    if (selectedTermIds.length > 0) {
      $button.show();
    } else {
      $button.hide();
    }
  }

  /**
   * Handle including surrounding states.
   */
  function handleIncludeSurroundingStates($button) {
    const selectedTermIds = getSelectedTermIds();
    
    if (selectedTermIds.length === 0) {
      showMessage(Drupal.t('Please select at least one state first.'), 'warning');
      return;
    }

    // Show loading state
    $button.prop('disabled', true).text(Drupal.t('Loading...'));

    // Make AJAX request to get related states
    $.ajax({
      url: '/ajax/get-related-states',
      type: 'POST',
      data: {
        term_ids: selectedTermIds
      },
      dataType: 'json',
      success: function(response) {
        if (response.success && response.related_state_ids.length > 0) {
          addSurroundingStatesToUrl(response.related_state_ids);
        } else {
          showMessage(Drupal.t('No surrounding states found for the selected location(s).'), 'info');
          setButtonToIncludeMode($button);
        }
      },
      error: function() {
        showMessage(Drupal.t('Error loading surrounding states. Please try again.'), 'error');
        setButtonToIncludeMode($button);
      }
    });
  }

  /**
   * Handle removing surrounding states.
   */
  function handleRemoveSurroundingStates($button) {
    removeSurroundingStatesFromUrl();
    setButtonToIncludeMode($button);
    // Note: Page will reload, so visibility will be updated on next page load
  }

  /**
   * Get currently selected term IDs from the URL (excluding surrounding states).
   */
  function getSelectedTermIds() {
    const urlParams = new URLSearchParams(window.location.search);
    const termIds = [];
    
    // Extract term IDs from f[] parameters, but exclude auto-added surrounding states
    urlParams.forEach((value, key) => {
      if (key.startsWith('f[') && value.includes('surrounding_search:')) {
        const indexMatch = key.match(/^f\[(\d+)\]$/);
        if (indexMatch) {
          const index = indexMatch[1];
          // Only include if this is NOT a surrounding state (no corresponding surrounding_state marker)
          if (!urlParams.has(`surrounding_state[${index}]`)) {
            const termId = value.split('surrounding_search:')[1];
            if (termId && !isNaN(termId)) {
              termIds.push(parseInt(termId));
            }
          }
        }
      }
    });
    
    return termIds;
  }

  /**
   * Add surrounding states to the URL.
   */
  function addSurroundingStatesToUrl(relatedStateIds) {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Find the next available f[] index
    let maxIndex = -1;
    urlParams.forEach((value, key) => {
      const match = key.match(/^f\[(\d+)\]$/);
      if (match) {
        maxIndex = Math.max(maxIndex, parseInt(match[1]));
      }
    });
    
    // Add related states with a special marker to identify them
    relatedStateIds.forEach((stateId, index) => {
      const newIndex = maxIndex + 1 + index;
      urlParams.set(`f[${newIndex}]`, `surrounding_search:${stateId}`);
      // Mark as surrounding state for easy removal later
      urlParams.set(`surrounding_state[${newIndex}]`, '1');
    });
    
    // Update URL and reload
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.location.href = newUrl;
  }

  /**
   * Remove surrounding states from the URL.
   */
  function removeSurroundingStatesFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const keysToRemove = [];
    
    // Find all surrounding state parameters
    urlParams.forEach((value, key) => {
      if (key.startsWith('surrounding_state[')) {
        const match = key.match(/^surrounding_state\[(\d+)\]$/);
        if (match) {
          const index = match[1];
          keysToRemove.push(`f[${index}]`);
          keysToRemove.push(`surrounding_state[${index}]`);
        }
      }
    });
    
    // Remove the identified parameters
    keysToRemove.forEach(key => {
      urlParams.delete(key);
    });
    
    // Reindex f[] parameters to maintain sequence
    const fParams = [];
    urlParams.forEach((value, key) => {
      if (key.startsWith('f[')) {
        fParams.push(value);
        urlParams.delete(key);
      }
    });
    
    // Re-add f[] parameters with proper indexing
    fParams.forEach((value, index) => {
      urlParams.set(`f[${index}]`, value);
    });
    
    // Update URL and reload
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.location.href = newUrl;
  }

  /**
   * Check if surrounding states are present in URL.
   */
  function hasSurroundingStatesInUrl(urlParams) {
    let found = false;
    urlParams.forEach((value, key) => {
      if (key.startsWith('surrounding_state[')) {
        found = true;
      }
    });
    return found;
  }

  /**
   * Set button to include mode.
   */
  function setButtonToIncludeMode($button) {
    $button
      .removeClass('remove-mode')
      .addClass('include-mode')
      .text(Drupal.t('Include Surrounding Areas'))
      .prop('disabled', false);
  }

  /**
   * Set button to remove mode.
   */
  function setButtonToRemoveMode($button) {
    $button
      .removeClass('include-mode')
      .addClass('remove-mode')
      .text(Drupal.t('Remove Surrounding Areas'))
      .prop('disabled', false);
  }

  /**
   * Show a message to the user.
   */
  function showMessage(message, type) {
    // Create a simple message display
    const $messageContainer = $('#messages-container');
    
    if ($messageContainer.length === 0) {
      // Create message container if it doesn't exist
      $('body').prepend('<div id="messages-container"></div>');
    }
    
    const $message = $(`<div class="messages messages--${type}" role="alert">${message}</div>`);
    $('#messages-container').html($message);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      $message.fadeOut();
    }, 5000);
  }

})(jQuery, Drupal, once); 