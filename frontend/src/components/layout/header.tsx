import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

const Header = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileLogoButtonRef = useRef<HTMLButtonElement>(null);
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";

  useEffect(() => {
    const darkModeEnabled = localStorage.getItem('darkModeEnabled') === 'true';
    setDarkMode(darkModeEnabled);
    document.documentElement.classList.toggle('dark', darkModeEnabled);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkModeEnabled', newMode.toString());
    document.documentElement.classList.toggle('dark', newMode);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const handleSignOut = () => {
    signOut();
    setIsProfileMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        profileLogoButtonRef.current &&
        !profileLogoButtonRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef, profileLogoButtonRef]);

  return (
      <nav className="bg-white text-gray-800 border-gray-500 dark:bg-black shadow-sm shadow-slate-800 dark:border-white dark:text-white">
          <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
              <Link href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
                  <Image src="https://flowbite.com/docs/images/logo.svg" className="h-8" width={30} height={30} alt="Flowbite Logo" />
                  <span className="self-center text-2xl font-semibold whitespace-nowrap text-black dark:text-white">Cinemation</span>
              </Link>
              <div className='flex justify-between gap-5 items-center'>
                  <button onClick={() => setMenuOpen(!isMenuOpen)} data-collapse-toggle="navbar-dropdown" type="button" className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-white rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" aria-controls="navbar-dropdown" aria-expanded={isMenuOpen ? 'true' : 'false'}>
                      <span className="sr-only">Open main menu</span>
                      <svg className="w-5 h-5 text-black dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15"/>
                      </svg>
                  </button>
                  <div className="hidden w-full md:block md:w-auto" >
                      <ul className="flex flex-col font-medium md:p-0 mt-4 border border-gray-100 rounded-lg  md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0">
                          <li>
                              <Link href="/movies" className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent">Movies</Link>
                          </li>
                          <li>
                              <Link href="/locations" className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent">Locations</Link>
                          </li>
                          <li>
                              <Link href="/support" className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent">Support</Link>
                          </li>
                      </ul>
                  </div>
              <div className={`${isMenuOpen ? 'slide-in' : 'slide-out'} md:hidden ${isMenuOpen ? 'block' : 'hidden'} fixed inset-0 bg-white dark:bg-gray-700 overflow-auto divide-y divide-gray-100 dark:divide-gray-600`} id="navbar-dropdown">
              <button 
                onClick={() => setMenuOpen(false)}
                className="absolute top-4 right-4 text-4xl text-gray-700 dark:text-gray-300"
                aria-label="Close menu"
              >
                &times;
              </button>
              <ul className="flex flex-col items-center justify-center h-full text-xl">
                  <li className="py-5"><Link href="/movies" className="px-3">Movies</Link></li>
                  <li className="py-5"><Link href="/locations" className="px-3">Locations</Link></li>
                  <li className="py-5"><Link href="/support" className="px-3">Support</Link></li>
              </ul>
          </div>

          <div className="flex items-center gap-3 md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
              <button
                type="button"
                onClick={toggleDarkMode}
                className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:hover:bg-gray-700 dark:focus:ring-gray-600 bg-white dark:bg-black text-black dark:text-white"
              >
              {darkMode ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    version="1.1"
                    width="24"
                    height="24"
                    viewBox="0 0 256 256"
                    className="w-5 h-5"
                  >
                      <defs />
                      <g
                        style={{
                          stroke: 'none',
                          strokeWidth: 0,
                          strokeDasharray: 'none',
                          strokeLinecap: 'butt',
                          strokeLinejoin: 'miter',
                          strokeMiterlimit: 10,
                          fill: 'none',
                          fillRule: 'nonzero',
                          opacity: 1,
                        }}
                        transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)"
                      >
                          <path
                            d="M 87.823 60.7 c -0.463 -0.423 -1.142 -0.506 -1.695 -0.214 c -15.834 8.398 -35.266 2.812 -44.232 -12.718 c -8.966 -15.53 -4.09 -35.149 11.101 -44.665 c 0.531 -0.332 0.796 -0.963 0.661 -1.574 c -0.134 -0.612 -0.638 -1.074 -1.259 -1.153 c -9.843 -1.265 -19.59 0.692 -28.193 5.66 C 13.8 12.041 6.356 21.743 3.246 33.35 S 1.732 57.08 7.741 67.487 c 6.008 10.407 15.709 17.851 27.316 20.961 C 38.933 89.486 42.866 90 46.774 90 c 7.795 0 15.489 -2.044 22.42 -6.046 c 8.601 -4.966 15.171 -12.43 18.997 -21.586 C 88.433 61.79 88.285 61.123 87.823 60.7 z"
                            style={{
                              stroke: 'none',
                              strokeWidth: 1,
                              strokeDasharray: 'none',
                              strokeLinecap: 'butt',
                              strokeLinejoin: 'miter',
                              strokeMiterlimit: 10,
                              fill: 'rgb(255,255,255)',
                              fillRule: 'nonzero',
                              opacity: 1,
                            }}
                            transform="matrix(1 0 0 1 0 0)"
                            strokeLinecap="round"
                          />
                      </g>
                  </svg>
              ) : (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g clipPath="url(#a)" stroke="#000000" strokeWidth="1.5" strokeMiterlimit="10">
                      <path
                        d="M5 12H1M23 12h-4M7.05 7.05 4.222 4.222M19.778 19.778 16.95 16.95M7.05 16.95l-2.828 2.828M19.778 4.222 16.95 7.05"
                        strokeLinecap="round"
                      />
                      <path
                        d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                        fill="#000000"
                        fillOpacity=".16"
                      />
                      <path d="M12 19v4M12 1v4" strokeLinecap="round" />
                    </g>
                    <defs>
                      <clipPath id="a">
                        <path fill="#ffffff" d="M0 0h24v24H0z" />
                      </clipPath>
                    </defs>
                  </svg>
              )}
                  <span className="sr-only">Toggle Dark Mode</span>
              </button>
              {isLoggedIn ? (
              <button
                id="profileLogoButton"
                type="button"
                className="flex text-sm bg-white dark:white rounded-full md:me-0 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
                aria-expanded={isProfileMenuOpen ? 'true' : 'false'}
                onClick={toggleProfileMenu}
                ref={profileLogoButtonRef}
                data-dropdown-toggle="user-dropdown"
                data-dropdown-placement="bottom"
              >
                  <span className="sr-only">Open user menu</span>
                  <svg height="32" viewBox="0 0 32 32" width="32" xmlns="http://www.w3.org/2000/svg">
                      <path d="m16 8a5 5 0 1 0 5 5 5 5 0 0 0 -5-5zm0 8a3 3 0 1 1 3-3 3.0034 3.0034 0 0 1 -3 3z"/><path d="m16 2a14 14 0 1 0 14 14 14.0158 14.0158 0 0 0 -14-14zm-6 24.3765v-1.3765a3.0033 3.0033 0 0 1 3-3h6a3.0033 3.0033 0 0 1 3 3v1.3765a11.8989 11.8989 0 0 1 -12 0zm13.9925-1.4507a5.0016 5.0016 0 0 0 -4.9925-4.9258h-6a5.0016 5.0016 0 0 0 -4.9925 4.9258 12 12 0 1 1 15.985 0z"/><path d="m0 0h32v32h-32z" fill="none"/>
                  </svg>
              </button>
              ) : (
              <Link href="/login" className="text-gray-900 dark:text-white">Log in</Link>
              )}
              <div
                ref={dropdownRef}
                className={`absolute right-0 mt-72 w-48 lg:right bg-white divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700 dark:divide-gray-600 ${
                isProfileMenuOpen ? 'block' : 'hidden'
                }`}
                id="user-dropdown"
              >
                  <div className="px-4 py-3">
                      <span className="block text-sm text-gray-900 dark:text-white">{session?.username}</span>
                      <span className="block text-sm text-gray-500 truncate dark:text-gray-400">{session?.email}</span>
                  </div>
                  <ul className="py-2" aria-labelledby="user-menu-button">
                      <li>
                          <Link href={`/settings/${session?.id}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">
                          Settings
                          </Link>
                      </li>
                      <li>
                          <Link href={`/tickets/${session?.id}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">
                          Tickets
                          </Link>
                      </li>
                      {isLoggedIn && (
                      <li>
                          <button
                            onClick={handleSignOut}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white w-full text-left"
                          >
                              Sign out
                          </button>
                      </li>
                      )}
                  </ul>
              </div>
          </div>
      </div>
  </div>
</nav>
  );
};

export default Header;
