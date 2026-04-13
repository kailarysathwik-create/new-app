/**
 * Utility to parse Instagram Data Export (JSON)
 * Instagram usually provides data in ZIP format. 
 * Once unzipped, 'content/posts_1.json' contains the history.
 */

export const parseInstagramPosts = (jsonData) => {
    try {
        // Instagram JSON format is usually an array of media objects
        return jsonData.map(item => ({
            caption: item.media?.[0]?.title || '',
            media_url: item.media?.[0]?.uri || '',
            timestamp: item.media?.[0]?.creation_timestamp,
            is_instagram_import: true
        }));
    } catch (error) {
        console.error('Failed to parse Instagram data:', error);
        return [];
    }
};

export const syncInstagramToVeil = async (posts, userId, supabase) => {
    // This would bulk insert the parsed posts into the Supabase 'posts' table
    const formattedPosts = posts.map(p => ({
        user_id: userId,
        caption: p.caption,
        media_url: p.media_url, // In a real app, we'd need to re-upload the local IG image to Supabase Storage
        created_at: new Date(p.timestamp * 1000).toISOString(),
    }));

    const { data, error } = await supabase.from('posts').insert(formattedPosts);
    return { data, error };
};
