# Crime Data Visualization Map 🗺️

A real-time interactive crime data visualization application built with Next.js and Mapbox GL JS. This application provides an intuitive way to explore crime patterns across Texas communities with advanced filtering and search capabilities.

## 🌟 Features

### Interactive Map Visualization
- **Real-time Crime Data**: Visualize crime incidents on an interactive map
- **Color-coded Crime Types**: Different colors for various crime categories (Murder, Theft, Burglary, Assault, DWI, Auto Theft)
- **Responsive Design**: Optimized for desktop and mobile devices
- **Dark Theme**: Eye-friendly dark interface with custom styling

### Advanced Filtering
- **Time Range Filtering**: Filter data by 1 Month, 3 Months, 6 Months, or 1 Year
- **Crime Type Filtering**: Select specific crime types to display
- **Select All/Deselect All**: Quick toggle for crime type selection
- **Real-time Updates**: Instant map updates when filters change

### Search & Navigation
- **Geocoder Integration**: Search for specific locations using Mapbox Geocoder
- **Texas-focused**: Optimized search bounds for Texas region
- **Navigation Controls**: Zoom, pan, and rotate controls
- **Location Display**: Live coordinates and zoom level display

### User Experience
- **Interactive Popups**: Click on crime points to view detailed information
- **Loading States**: Visual feedback during data loading
- **Error Handling**: User-friendly error messages
- **Optimized Performance**: Efficient data loading and rendering

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (React 18)
- **Mapping**: Mapbox GL JS
- **Database**: Turso (LibSQL)
- **Styling**: Tailwind CSS
- **Geocoding**: Mapbox Geocoder
- **Deployment**: Vercel-ready

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js 18+ installed
- A Mapbox account and API token
- A Turso database with crime data

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/crime-map-project.git
   cd crime-map-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_MAPBOX_TOKEN="your_mapbox_token_here"
   turso_url="your_turso_database_url"
   turso_token="your_turso_auth_token"
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Schema

The application expects a `crime_data` table with the following structure:

```sql
CREATE TABLE crime_data (
    case_number TEXT,
    reported_date TEXT,
    nature_of_call TEXT,
    from_date TEXT,
    description TEXT,
    block_address TEXT,
    city TEXT,
    state TEXT,
    division TEXT,
    attempt_complete TEXT,
    location_description TEXT,
    latitude REAL,
    longitude REAL
);
```

## 🔧 Configuration

### Mapbox Setup
1. Create a [Mapbox account](https://www.mapbox.com/)
2. Generate an access token
3. Add the token to your environment variables

### Turso Database Setup
1. Create a [Turso account](https://turso.tech/)
2. Create a new database
3. Import your crime data
4. Get your database URL and auth token
5. Add credentials to environment variables

## 📊 API Endpoints

### GET `/api/crimes`

Fetches crime data with optional filtering.

**Query Parameters:**
- `timeRange` (optional): `1M` | `3M` | `6M` | `1Y` (default: `1M`)
- `crimeTypes` (optional): Comma-separated crime types or `ALL`

**Response:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [longitude, latitude]
      },
      "properties": {
        "Case Number": "string",
        "Reported Date": "string",
        "Nature Of Call": "string",
        "Description": "string",
        "Block Address": "string",
        "City": "string",
        // ... other properties
      }
    }
  ]
}
```

## 🎨 Customization

### Adding New Crime Types
Update the `CRIME_TYPES` array in `src/components/Map.js`:

```javascript
const CRIME_TYPES = [
  { value: "NEW_CRIME", label: "New Crime Type" },
  // ... existing types
];
```

### Modifying Map Style
Change the map style in `src/components/Map.js`:

```javascript
style: "mapbox://styles/mapbox/streets-v12" // or any other Mapbox style
```

### Customizing Colors
Modify the color scheme in the `circle-color` paint property:

```javascript
"circle-color": [
  "match",
  ["get", "Nature Of Call"],
  "YOUR_CRIME_TYPE", "#your_color",
  // ... other mappings
]
```

## 📱 Responsive Design

The application is fully responsive and includes:
- Mobile-optimized controls and filters
- Responsive map container sizing
- Touch-friendly interface elements
- Adaptive text and button sizing

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Other Platforms
The application can be deployed on any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🛡️ Security

- Environment variables are used for sensitive data
- API tokens are never exposed to client-side code
- Database connections are properly managed and closed

## 🐛 Troubleshooting

### Common Issues

**Crime points not showing:**
- Check your Mapbox token
- Verify database connection
- Ensure data has valid coordinates

**Database connection errors:**
- Verify Turso credentials
- Check network connectivity
- Confirm database schema matches expected structure

**Map not loading:**
- Check browser console for errors
- Verify Mapbox token is valid
- Ensure proper HTTPS setup in production

## 📞 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/yourusername/crime-map-project/issues) page
2. Create a new issue with detailed information
3. Include browser information and error messages

## 🙏 Acknowledgments

- [Mapbox](https://www.mapbox.com/) for the mapping platform
- [Turso](https://turso.tech/) for the database hosting
- [Next.js](https://nextjs.org/) for the React framework
- [Tailwind CSS](https://tailwindcss.com/) for styling utilities

---

**Made with ❤️ for community safety and awareness
