import React from 'react';

const useAnnouncements = ({ isSupabaseEnabled, supabase, defaultAnnouncements }) => {
  const [announcements, setAnnouncements] = React.useState(defaultAnnouncements);
  const [status, setStatus] = React.useState('');

  React.useEffect(() => {
    if (!isSupabaseEnabled) {
      return undefined;
    }

    let isActive = true;

    const fetchAnnouncements = async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('id, title, message, created_at')
        .order('created_at', { ascending: false });

      if (!isActive) {
        return;
      }

      if (error) {
        setStatus('Unable to load announcements from Supabase.');
        return;
      }

      const mappedAnnouncements = (data || []).map((announcement) => ({
        id: announcement.id,
        title: announcement.title || 'Announcement',
        message: announcement.message || '',
        createdAt: announcement.created_at || '',
      }));

      setAnnouncements(mappedAnnouncements.length ? mappedAnnouncements : defaultAnnouncements);
      setStatus('');
    };

    fetchAnnouncements();

    return () => {
      isActive = false;
    };
  }, [isSupabaseEnabled, supabase, defaultAnnouncements]);

  return {
    announcements,
    status,
  };
};

export default useAnnouncements;
