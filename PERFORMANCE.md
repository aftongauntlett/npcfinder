# Performance Optimization Report

## Latest Metrics (Dec 8, 2025 - Post Settings Refactor)

### Current Performance:
- **LCP: 3.01s** (Target: < 2.5s) ❌ Needs improvement
- **CLS: 0.37** (Target: < 0.1) ❌ CRITICAL - High layout shift
- **Network: 381 requests / 29.1 MB transferred** ✅ Improved from 2,722!
- **Load Time: 19.50s** ⚠️ Slow (partly due to local dev overhead)

### Issues Fixed:
✅ Reduced requests from 2,722 → 381 (86% improvement!)
✅ Fixed nested `<form>` error in PasswordChangeSection
✅ UserSettings now uses cached `useProfileQuery()`
✅ Removed y-axis animations from UserSettings to prevent CLS
✅ Added skeleton loaders to HomePage and UserSettings
✅ Changed animation duration from 0.3s → 0.2s for faster perceived load

---

## Root Causes Identified

### 1. ❌ CRITICAL: High CLS (0.37)
**Problem:** Layout shifting significantly after initial render

**Likely Causes:**
- Framer Motion animations causing reflow
- Missing skeleton loaders for async content
- Dynamic card heights without reserved space
- Images loading without dimensions

**Recommended Fixes:**
```tsx
// ✅ IMPLEMENTED: Add skeleton loaders
{isLoading ? <SkeletonCard variant="stat" /> : <ActualCard />}

// ✅ IMPLEMENTED: Remove y-axis animations  
initial={{ opacity: 0 }} // Removed y: 20
animate={{ opacity: 1 }}

// TODO: Reserve space for images
<img width="400" height="300" ... />

// TODO: Reduce animation impact further
transition={{ duration: 0.1 }} // Even faster
```

### 2. ⚠️ LCP (3.01s) - Slightly Over Target
**Problem:** Largest Contentful Paint is slow

**Likely Causes:**
- Large bundle size on initial load
- No font preloading
- Images not optimized
- Critical CSS not inlined

**Recommended Fixes:**
- Add `<link rel="preload">` for fonts
- Optimize/compress hero images
- Consider code splitting by route
- Use `fetchpriority="high"` on LCP element

### 3. ⚠️ Load Time (19.50s)
**Analysis:** This is the `DOMContentLoaded` event time

**Context:**
- Partly expected in local dev (Vite HMR adds overhead)
- 381 requests is still high but much better
- Many requests are to Supabase (user, profiles, roles)

**What's "Normal":**
- Production (optimized): 2-5s
- Local dev: 10-20s (acceptable)
- The 19.50s is likely local dev + initial cache population

---

## Performance Improvements Made

### ✅ UserSettings.tsx Refactor

**Before:**
```typescript
// ❌ Direct API call on every load
const { data, error } = await getUserProfile(currentUser.id);
```

**After:**
```typescript
// ✅ Use cached query
const { data: cachedProfile, isLoading } = useProfileQuery();
```

**Benefits:**
- ✅ Eliminates redundant profile fetches
- ✅ Instant load if data is in cache
- ✅ Automatic cache invalidation on save
- ✅ Shared cache with HomePage & other components

---

## Recommendations for Further Optimization

### High Priority

1. **Audit Network Tab**
   - Identify which requests are duplicated
   - Look for requests that can be batched
   - Check if all 2,722 requests are necessary

2. **Database Query Optimization**
   ```sql
   -- Ensure indexes exist on frequently queried columns
   CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id 
   ON user_profiles(user_id);
   ```

3. **Bundle Analysis**
   ```bash
   npm run build
   npx vite-bundle-visualizer
   ```
   - Check for large dependencies
   - Look for duplicate code
   - Consider code splitting

### Medium Priority

4. **Image Optimization**
   - Use WebP format where supported
   - Implement responsive images with srcset
   - Add blur-up placeholders for better perceived performance

5. **Component Memoization**
   - Audit components using DevTools Profiler
   - Add `React.memo()` to expensive components
   - Use `useMemo()` / `useCallback()` for heavy computations

6. **Prefetch Critical Data**
   ```typescript
   // Prefetch user data on app load
   queryClient.prefetchQuery({
     queryKey: ['user-profile', user.id],
     queryFn: () => getUserProfile(user.id)
   });
   ```

### Low Priority

7. **Font Loading Strategy**
   - Preload critical fonts
   - Use `font-display: swap`

8. **Third-party Scripts**
   - Defer non-critical scripts
   - Use `async` or `defer` attributes

---

## Expected Impact

With UserSettings fix alone:
- **Reduced API calls:** ~1-10 fewer requests per settings visit
- **Faster settings load:** Instant if cached, ~300ms savings if fetching
- **Better cache hit rate:** Profile data shared across app

Next steps: Monitor network tab to identify other uncached queries.

---

## Testing Checklist

- [x] Verify UserSettings loads instantly on second visit
- [ ] Check Network tab for duplicate user_profiles queries
- [ ] Run Lighthouse audit again and compare
- [ ] Test with slow 3G throttling
- [ ] Profile with React DevTools to find render bottlenecks

