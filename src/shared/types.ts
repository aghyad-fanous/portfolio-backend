export type Language = 'en' | 'ar';

export type Experience = {
  id: string;
  title: string;
  company?: string;
  from?: string;
  to?: string | null;
  description?: string;
  locale?: Language;
};

export type Project ={
      title: string;
      description: string;
      image?: string;
      liveUrl?: string;
      codeUrl?: string;
      tags: string[];
    };