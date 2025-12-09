import { Email, GitHub, LinkedIn, Resume } from 'icons';
import { Config } from 'types';

export const config: Config = {
  name: {
    display: 'Abdoslam Baabbad',
  },
  title: {
    display: '',
  },
  buttons: [
    {
      name: 'github',
      display: 'GitHub',
      ariaLabel: 'GitHub profile (opens in new window)',
      icon: <GitHub />,
      href: 'https://github.com/AbdoslamB/',
    },
    {
      name: 'linked-in',
      display: 'LinkedIn',
      ariaLabel: 'LinkedIn profile (opens in new window)',
      icon: <LinkedIn />,
      href: 'https://www.linkedin.com/in/abdoslambaabbad',
    },
    {
      name: 'resume',
      display: 'Resume',
      ariaLabel: 'Resume in Google Drive (opens in new window)',
      icon: <Resume />,
      href: '',
    },
    {
      name: 'email',
      display: 'Email',
      ariaLabel: 'Email contact (opens in new window)',
      icon: <Email />,
      href: 'mailto:abdoslam.baabbad+github@gmail.com',
    },
  ],
};
