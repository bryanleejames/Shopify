import { verses } from "~/data/verses.json";

/**
 * ============================================
 * TRUTHWELL — Premium Dashboard Design Specs
 * ============================================
 *
 * This document defines the design direction for TruthWell's
 * premium subscriber dashboard. It describes three key pages
 * and the visual treatment that distinguishes premium from free.
 *
 * See the companion React components in this directory for
 * visual implementation prototypes.
 */

/**
 * SECTION 1: PREMIUM vs FREE VISUAL DIFFERENCES
 * ============================================
 *
 * FREE TIER:
 * - Single daily verse card (no browsing)
 * - Minimal styling: white cards, indigo accent lines
 * - Basic Inter font throughout
 * - Simple light backgrounds
 * - "Upgrade to Premium" prompts as soft CTAs
 *
 * PREMIUM TIER:
 * - Gold/amber accents throughout (borders, dividers, icon highlights)
 * - Subtle glassmorphism on cards (backdrop-blur, semi-transparent)
 * - DM Serif Display for premium section headers
 * - Additional animation: verse cards fade in with a gentle slide-up
 * - Premium badge indicator — small gold crown icon or "✦ PREMIUM" tag
 * - Slightly elevated shadows on premium content
 * - Background subtle warm radial gradient on premium sections
 * - "✦" ornament dividers between sections
 */

/**
 * SECTION 2: VERSE JOURNAL PAGE
 * ============================================
 *
 * Layout:
 * - Left sidebar: date navigation (calendar mini, month view)
 * - Main area: journal entries in reverse chronological order
 * - Each entry: verse card (compact) + user's written reflection below
 * - "New Entry" floating button (gold accent)
 *
 * Key elements:
 * - Date-stamped entries with subtle dividers
 * - Entry card: verse reference at top, verse text in italic serif,
 *   user's journal text below in regular Inter, timestamp
 * - Empty state: "Start your journey" with a sample prompt
 * - Search bar at top to find entries by verse reference or keyword
 * - Mood/emotion tag per entry (optional small chips)
 *
 * Premium indicators:
 * - Gold ornamental divider between entries
 * - Slight glassmorphism on entry cards
 * - "Premium Journal" badge in header
 * - Export/print buttons (gold accent outline)
 */

/**
 * SECTION 3: AUDIO PLAYER SECTION
 * ============================================
 *
 * Layout:
 * - Minimal, elegant audio player bar at bottom (sticky)
 * - Expandable to full player view
 * - Full view: album-art-style verse background, large play button,
 *   waveform visualization (subtle), progress bar
 *
 * Key elements:
 * - Playlist of audio readings organized by theme
 * - Each track: verse reference, reader name, duration, theme tag
 * - Current track: highlighted with gold left border
 * - Play/pause, skip forward/back, speed control (0.75x-2x)
 * - Sleep timer feature
 * - Download for offline access
 *
 * Premium indicators:
 * - Gold accent on active track
 * - Subtle animated progress bar with gold gradient
 * - "Audio" section has a slight warm tinted background
 * - Premium badge on the player header
 */

/**
 * SECTION 4: PREMIUM THEME LIBRARY
 * ============================================
 *
 * Layout:
 * - Grid of theme cards (2 columns on tablet, 3 on desktop)
 * - Each theme card: circular icon/emblem at top, theme name,
 *   verse count, brief description, color accent bar
 * - Clicking a theme opens the full verse list for that theme
 *
 * Theme card design:
 * - Icon: abstract symbol (cross, dove, anchor, heart, flame, etc.)
 * - Background: subtle gradient matching the mood color
 * - Hover: gentle lift + glow effect
 * - Number of verses visible as a count badge
 *
 * Full theme view:
 * - Hero section with theme name, description, color
 * - Verses displayed as a vertical stack of verse cards
 * - Each verse card: expandable to show prompt + devotional
 * - Filter by sub-theme within the theme
 * - "Share verse" button on each card
 * - "Save to journal" button on each card
 *
 * Premium indicators:
 * - All themes unlock (free tier only gets 3 themed verses/month)
 * - Gold corner accents on theme cards
 * - "✦ PREMIUM" subtle watermark on theme page background
 * - Smooth page transitions between themes
 */

/**
 * SECTION 5: LAYOUT / NAVIGATION
 * ============================================
 *
 * Premium Dashboard Navigation (after login):
 * - Top nav: TruthWell logo, Daily Verse link, Themes link,
 *   Journal link, Audio link, Profile/Settings
 * - Active page indicator: gold bottom border
 * - Account button shows plan type: "Premium" with a gold icon
 *
 * Color scheme within dashboard:
 * - Background: warm white (#faf8f4) → dark mode: deep indigo (#1a1638)
 * - Cards: white with subtle warm tint → dark: indigo with warm tint
 * - Accent: gold/amber (#f59e0b) for premium-specific elements
 * - Primary CTAs: indigo (#4f46e5) for general actions
 * - Text: dark indigo (#1a1a2e) → light: white
 * - Muted text: #6b6b80 → dark: rgba(255,255,255,0.6)
 */

export const PremiumDesignSpec = {
  name: "TruthWell Premium Dashboard",
  version: "1.0.0",
  designTokens: {
    premiumAccent: "#f59e0b",
    premiumAccentLight: "rgba(245, 158, 11, 0.1)",
    premiumGlow: "0 0 20px rgba(245, 158, 11, 0.15)",
    premiumBadge: "✦ PREMIUM",
    glassBg: "rgba(255, 255, 255, 0.7)",
    glassBgDark: "rgba(30, 27, 75, 0.5)",
    glassBorder: "rgba(255, 255, 255, 0.15)",
    glassBorderDark: "rgba(99, 102, 241, 0.12)",
    goldGradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    cardElevation: "0 8px 32px rgba(0, 0, 0, 0.08)",
    pageBg: "#faf8f4",
    pageBgDark: "#1a1638",
    ornamentChar: "✦",
  },
  pages: [
    {
      name: "Premium Theme Library",
      route: "/themes",
      components: ["ThemeCard", "ThemeGrid", "VerseList", "VerseExpandable"],
    },
    {
      name: "Verse Journal",
      route: "/journal",
      components: ["JournalEntry", "CalendarNav", "SearchBar", "NewEntryButton"],
    },
    {
      name: "Audio Player",
      route: "/audio",
      components: ["PlayerBar", "FullPlayer", "Playlist", "TrackItem", "SpeedControl", "SleepTimer"],
    },
  ],
};
