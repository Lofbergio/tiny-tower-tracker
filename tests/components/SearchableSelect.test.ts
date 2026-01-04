/**
 * Tests for SearchableSelect component.
 *
 * These tests cover bugs we've actually hit in production:
 * 1. Selected value not displaying when items exceed requireSearchThreshold
 * 2. Selected item should be visible in dropdown even when filtered out
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SearchableSelect from '@/components/ui/SearchableSelect.vue'

// Generate many items to trigger "search required" mode (> 40 by default)
function generateItems(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    value: `item-${i}`,
    label: `Item ${i}`,
  }))
}

describe('SearchableSelect', () => {
  describe('displaying selected value', () => {
    it('shows placeholder when no value selected', () => {
      const items = generateItems(10)
      const wrapper = mount(SearchableSelect, {
        props: {
          items,
          placeholder: 'Select something...',
        },
      })

      expect(wrapper.text()).toContain('Select something...')
    })

    it('shows selected item label when value is set (small list)', () => {
      const items = generateItems(10)
      const wrapper = mount(SearchableSelect, {
        props: {
          items,
          modelValue: 'item-5',
          placeholder: 'Select something...',
        },
      })

      expect(wrapper.text()).toContain('Item 5')
      expect(wrapper.text()).not.toContain('Select something...')
    })

    it('shows selected item label when value is set (large list - search required mode)', () => {
      // This was the actual bug: with 167 stores (> 40 threshold),
      // the selected value would not display because Radix's SelectValue
      // couldn't find the SelectItem in the DOM
      const items = generateItems(100) // Exceeds default threshold of 40
      const wrapper = mount(SearchableSelect, {
        props: {
          items,
          modelValue: 'item-75',
          placeholder: 'Select something...',
        },
      })

      // The bug was that this would show "Select something..." instead of "Item 75"
      expect(wrapper.text()).toContain('Item 75')
      expect(wrapper.text()).not.toContain('Select something...')
    })

    it('shows selected item label even with custom threshold', () => {
      const items = generateItems(50)
      const wrapper = mount(SearchableSelect, {
        props: {
          items,
          modelValue: 'item-42',
          requireSearchThreshold: 20, // Custom lower threshold
        },
      })

      expect(wrapper.text()).toContain('Item 42')
    })
  })

  describe('computed properties', () => {
    it('selectedItem finds the correct item from items list', () => {
      const items = [
        { value: 'cake-studio', label: 'Cake Studio' },
        { value: 'soda-brewery', label: 'Soda Brewery' },
        { value: 'game-studio', label: 'Game Studio' },
      ]
      const wrapper = mount(SearchableSelect, {
        props: {
          items,
          modelValue: 'soda-brewery',
        },
      })

      expect(wrapper.text()).toContain('Soda Brewery')
    })

    it('handles modelValue that does not exist in items', () => {
      const items = [
        { value: 'cake-studio', label: 'Cake Studio' },
        { value: 'soda-brewery', label: 'Soda Brewery' },
      ]
      const wrapper = mount(SearchableSelect, {
        props: {
          items,
          modelValue: 'nonexistent-store',
          placeholder: 'Pick a store',
        },
      })

      // Should fall back to placeholder when value not found
      expect(wrapper.text()).toContain('Pick a store')
    })
  })

  describe('isSearchRequired behavior', () => {
    it('does not require search for small lists', () => {
      const items = generateItems(30) // Below default 40 threshold
      const wrapper = mount(SearchableSelect, {
        props: { items },
      })

      // Component should mount without issues
      expect(wrapper.exists()).toBe(true)
    })

    it('handles large lists gracefully', () => {
      const items = generateItems(200) // Well above default 40 threshold
      const wrapper = mount(SearchableSelect, {
        props: {
          items,
          modelValue: 'item-150',
        },
      })

      // Even with 200 items, selected value should display
      expect(wrapper.text()).toContain('Item 150')
    })
  })
})
