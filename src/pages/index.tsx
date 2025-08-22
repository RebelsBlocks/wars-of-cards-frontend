import type { NextPage } from 'next';

const HomePage: NextPage = () => {
  return (
    <section className="mx-auto flex h-full max-w-4xl md:max-w-5xl flex-col items-center justify-center px-3 md:px-4 text-center">
      <h1 className="mb-3 text-4xl font-extrabold tracking-tight gradient-text sm:text-5xl">
        Welcome to Wars of Cards
      </h1>
      <p className="mb-6 max-w-2xl text-[rgba(237,201,81,0.8)]">
        Choose a page from the navigation to start playing, chat with others, check your mail, or manage your profile.
      </p>
      <div className="flex gap-3">
        <a href="/Play" className="btn btn-primary">Play now</a>
        <a href="/Profile" className="btn btn-secondary">Profile</a>
      </div>
    </section>
  );
};

export default HomePage;
