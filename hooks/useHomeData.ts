import useSWR from 'swr';
import { useMemo } from 'react';
import type { DoubanMovie } from '@/types/douban';
import type { CategoryData, HeroData, HeroMovie } from '@/types/home';
import { getHeroMovies, getNewContent, getMoviesCategories, getTVCategories } from '@/lib/douban-service';

// SWR 缓存键
const SWR_KEY_HERO = 'home-hero';
const SWR_KEY_LATEST = 'home-latest';
const SWR_KEY_MOVIES = 'home-movies';
const SWR_KEY_TV = 'home-tv';

interface UseHomeDataReturn {
  categories: CategoryData[];
  heroMovies: DoubanMovie[];
  heroDataList: HeroData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useHomeData(): UseHomeDataReturn {
  const {
    data: heroData,
    error: heroError,
    isLoading: heroLoading,
    mutate: mutateHero,
  } = useSWR(SWR_KEY_HERO, getHeroMovies);

  const { data: latestData } = useSWR(SWR_KEY_LATEST, getNewContent);
  const { data: moviesData } = useSWR(SWR_KEY_MOVIES, getMoviesCategories);
  const { data: tvData } = useSWR(SWR_KEY_TV, getTVCategories);

  const { heroMovies, heroDataList } = useMemo(() => {
    if (!heroData || !Array.isArray(heroData)) {
      return { heroMovies: [] as DoubanMovie[], heroDataList: [] as HeroData[] };
    }

    const heroMoviesList: DoubanMovie[] = heroData.map((hero) => ({
      id: hero.id,
      title: hero.title,
      cover: hero.cover || '',
      url: hero.url || '',
      rate: hero.rate || '',
      episode_info: hero.episode_info || '',
      cover_x: 0,
      cover_y: 0,
      playable: false,
      is_new: false,
    }));

    const heroDataArray: HeroData[] = heroData.map((hero) => ({
      poster_horizontal: hero.poster_horizontal,
      poster_vertical: hero.poster_vertical,
      description: hero.description,
      genres: hero.genres,
    }));

    return { heroMovies: heroMoviesList, heroDataList: heroDataArray };
  }, [heroData]);

  const categories = useMemo(() => {
    const result: Array<{ name: string; data: Array<{ id: string; title: string; rate: string; cover: string; url: string; episode_info: string }> }> = [];
    const seen = new Set<string>();

    const merged = [
      ...(latestData || []),
      ...(moviesData || []),
      ...(tvData || []),
    ];

    for (const cat of merged) {
      if (seen.has(cat.name)) continue;
      if (!cat.data || cat.data.length === 0) continue;
      seen.add(cat.name);
      result.push({
        name: cat.name,
        data: cat.data.map((item) => ({
          id: item.id,
          title: item.title,
          rate: item.rate || '',
          cover: item.cover || '',
          url: item.url || '',
          episode_info: item.episode_info || '',
        })),
      });
    }

    return result;
  }, [latestData, moviesData, tvData]);

  const refetch = async () => {
    await Promise.all([mutateHero()]);
  };

  const error = heroError?.message || null;
  const loading = heroLoading && !heroData;

  return {
    categories,
    heroMovies,
    heroDataList,
    loading,
    error,
    refetch,
  };
}
