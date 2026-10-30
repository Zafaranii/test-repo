/**
 * Public contact / branding details shown across the site.
 * Everything here is a placeholder: replace with the client's real details before going live.
 */

const PLACEHOLDER_PHONE_DIGITS = '201000000000';

export const SITE_CONTACT = {
  ownerName: 'Owner Name',
  ownerTitle: 'Owner and founder of AYG',
  ownerPhoto: '/owner-placeholder.svg',

  // Shown in the footer
  phoneDisplay: '010 0000 0000',
  whatsappUrl: `https://wa.me/${PLACEHOLDER_PHONE_DIGITS}`,
  facebookUrl: 'https://www.facebook.com/',
  officeMapUrl: 'https://www.google.com/maps/search/?api=1&query=Maadi%2C+Cairo',

  // "How to find us" block in the footer (Arabic, shown right-to-left)
  officeHours: 'مواعيد العمل من ١٠ صباحًا إلى ٦ مساءً',
  officeAddressLines: ['العنوان : شارع المثال - المعادي - القاهرة', 'مبنى رقم ١٢٣', 'الدور الأول'],

  // WhatsApp numbers used on listing pages
  masterAdminPhone: `+${PLACEHOLDER_PHONE_DIGITS}`,
  fallbackPhone: '+201000000000',
};
