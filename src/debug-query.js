// Quick debug script to test the provider query
// Run this in browser console after opening the app

async function debugProviderQuery() {
  console.log('[DEBUG] Starting provider query debug...');
  
  try {
    // Get the supabase client from window (if available) or import it
    const { supabase } = await import('./integrations/supabase/client.ts');
    
    // First, check if we have any courses
    console.log('[DEBUG] Fetching courses...');
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title')
      .limit(5);
    
    if (coursesError) {
      console.error('[DEBUG] Error fetching courses:', coursesError);
      return;
    }
    
    console.log('[DEBUG] Available courses:', courses);
    
    if (!courses || courses.length === 0) {
      console.log('[DEBUG] No courses found');
      return;
    }
    
    // Test with the first course
    const testCourseId = courses[0].id;
    console.log(`[DEBUG] Testing with course ID: ${testCourseId}`);
    
    // Check course_provider_courses relationships
    console.log('[DEBUG] Checking course_provider_courses relationships...');
    const { data: relationships, error: relError } = await supabase
      .from('course_provider_courses')
      .select('*')
      .eq('course_id', testCourseId);
    
    if (relError) {
      console.error('[DEBUG] Error fetching relationships:', relError);
      return;
    }
    
    console.log('[DEBUG] Course provider relationships:', relationships);
    
    if (!relationships || relationships.length === 0) {
      console.log('[DEBUG] No relationships found for this course');
      
      // Let's see all relationships
      const { data: allRel } = await supabase
        .from('course_provider_courses')
        .select('*')
        .limit(10);
      
      console.log('[DEBUG] All course provider relationships:', allRel);
      return;
    }
    
    // Now test the actual join query
    console.log('[DEBUG] Testing join query...');
    const { data: joinData, error: joinError } = await supabase
      .from('course_provider_courses')
      .select(`
        course_providers (
          id,
          name,
          contact_person,
          email,
          phone,
          website,
          address,
          city,
          country,
          postcode,
          default_location,
          additional_locations,
          active,
          instructors,
          description,
          notes,
          created_at,
          updated_at
        )
      `)
      .eq('course_id', testCourseId);
    
    if (joinError) {
      console.error('[DEBUG] Error in join query:', joinError);
      return;
    }
    
    console.log('[DEBUG] Join query result:', joinData);
    
    const providers = joinData?.map(item => item.course_providers).filter(Boolean) || [];
    console.log('[DEBUG] Processed providers:', providers);
    console.log(`[DEBUG] Found ${providers.length} providers`);
    
  } catch (error) {
    console.error('[DEBUG] Unexpected error:', error);
  }
}

// Export for use in console
window.debugProviderQuery = debugProviderQuery;
console.log('Debug function loaded. Run: debugProviderQuery()');