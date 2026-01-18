export type Product = {
  id: string;
  title: string;
  price: string;
  location: string;
  description: string;
  images: any[];
  seller: {
    name: string;
    avatar: any;
    rating: number;
  };
};

export const PRODUCTS: Product[] = [
  {
    id: 'l1',
    title: 'Compact Car — Low mileage',
    price: '$7,500',
    location: 'San Francisco, CA',
    description:
      'Well-maintained compact car with low mileage. Recent service and new tires. Ideal for city driving and economical commutes. Clean interior and a reliable engine.',
    images: [
      require('../assets/images/react-logo.png'),
      require('../assets/images/partial-react-logo.png'),
      require('../assets/images/icon.png'),
    ],
    seller: {
      name: 'Alex Johnson',
      avatar: require('../assets/images/partial-react-logo.png'),
      rating: 4.6,
    },
  },
  {
    id: 'l2',
    title: 'Modern Sofa — 3-seater',
    price: '$250',
    location: 'Austin, TX',
    description:
      'Comfortable 3-seater sofa in very good condition. Neutral color that fits most interiors. Smoke-free home. Measurements available on request.',
    images: [require('../assets/images/icon.png'), require('../assets/images/react-logo.png')],
    seller: {
      name: 'Maya Lee',
      avatar: require('../assets/images/icon.png'),
      rating: 4.8,
    },
  },
  {
    id: 'l3',
    title: 'Smartphone — Like new',
    price: '$420',
    location: 'New York, NY',
    description: 'Excellent condition smartphone. Locked to carrier and comes with charger and case.',
    images: [require('../assets/images/partial-react-logo.png')],
    seller: {
      name: 'Sam Carter',
      avatar: require('../assets/images/react-logo.png'),
      rating: 4.5,
    },
  },
];
