import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const categories = [
  {
    name: 'Digital Products',
    slug: 'digital-products',
    description:
      'Templates, presets, design assets, and other downloadable files',
  },
  {
    name: 'Online Courses',
    slug: 'online-courses',
    description: 'Structured educational content with lessons and modules',
  },
  {
    name: 'Ebooks & Guides',
    slug: 'ebooks-guides',
    description: 'Written digital publications and how-to guides',
  },
  {
    name: 'Coaching & Consulting',
    slug: 'coaching-consulting',
    description: '1-on-1 or group sessions, calls, and advisory services',
  },
  {
    name: 'Music & Audio',
    slug: 'music-audio',
    description: 'Beats, sound kits, podcasts, and audio content',
  },
  {
    name: 'Design & Creative Assets',
    slug: 'design-creative-assets',
    description: 'Graphics, fonts, mockups, icon packs, Canva/Figma templates',
  },
  {
    name: 'Software & Tools',
    slug: 'software-tools',
    description: 'Scripts, plugins, apps, and technical utilities',
  },
  {
    name: 'Photography & Video',
    slug: 'photography-video',
    description: 'Stock footage, LUTs, presets, and video content',
  },
  {
    name: 'Writing & Editing Services',
    slug: 'writing-editing',
    description: 'Freelance writing, editing, and copywriting services',
  },
  {
    name: 'Fitness & Wellness',
    slug: 'fitness-wellness',
    description: 'Workout plans, meal plans, and wellness programs',
  },
  {
    name: 'Business & Finance',
    slug: 'business-finance',
    description: 'Templates, spreadsheets, and business resources',
  },
  {
    name: 'Merchandise',
    slug: 'merchandise',
    description: 'Physical or print-on-demand branded products',
  },
  {
    name: 'Membership & Community',
    slug: 'membership-community',
    description: 'Recurring access to exclusive content or communities',
  },
  {
    name: 'Events & Workshops',
    slug: 'events-workshops',
    description: 'Ticketed live sessions, webinars, and workshops',
  },
];

async function main() {
  console.log(`Seeding ${categories.length} categories...`);

  for (const category of categories) {
    const result = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
    console.log(`✓ ${result.name}`);
  }
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
