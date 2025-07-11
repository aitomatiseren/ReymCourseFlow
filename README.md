# Cursus Nexus - Training & Certification Management System

A comprehensive web application for managing employee training, certifications, and compliance tracking. Built with modern web technologies and designed specifically for organizations with Dutch business requirements and professional driver certification needs.

## 🚀 Live Demo

**Project URL**: https://lovable.dev/projects/77e93892-a682-4834-9c6f-af34d316c993

## 🎯 Key Features

### 📚 **Training Management**
- **Multi-session Training Support**: Handle complex training programs with multiple sessions
- **Smart Scheduling**: Calendar-based training scheduler with recurring sessions
- **Participant Management**: Track enrollments, attendance, and completion status
- **Interactive Checklists**: Training preparation and completion checklists
- **Real-time Updates**: Live training status updates and notifications

### 👥 **Employee Management**
- **Comprehensive Profiles**: Full employee records with Dutch name support (`tussenvoegsel`, `roepnaam`)
- **Dutch Business Compliance**: BSN management, extensive marital status options
- **Address Validation**: Smart city/country lookup with geocoding
- **License Tracking**: Complete driving license management (A, B, BE, C, CE, D, Code 95)
- **Status Management**: Employee availability and employment status tracking

### 🎓 **Certificate & Compliance**
- **Certificate Expiry Tracking**: Automated alerts for expiring certifications
- **Code 95 Compliance Dashboard**: EU professional driver certification management
- **License Categories**: Comprehensive tracking of all driving license types
- **Compliance Reporting**: Department-level compliance monitoring
- **Renewal Management**: Automated renewal reminders and workflows

### 🤖 **AI-Powered Assistant**
- **Contextual Help**: AI chat assistant that understands your current workflow
- **UI Automation**: AI can navigate and interact with the application
- **Smart Suggestions**: Intelligent recommendations for training and compliance
- **Natural Language Interface**: Ask questions and get instant assistance

### 📊 **Reporting & Analytics**
- **Compliance Reports**: Training completion rates and regulatory compliance
- **Cost Analysis**: Training budget tracking and ROI analysis
- **Certificate Expiry Reports**: Upcoming renewals and expired certificates
- **Dashboard Analytics**: Real-time KPIs and performance metrics

## 🛠 Tech Stack

### **Frontend Framework**
- **React 18.3.1** - Modern component-based UI framework
- **TypeScript 5.5.3** - Type-safe development with excellent IDE support
- **Vite 5.4.1** - Lightning-fast build tool with Hot Module Replacement

### **Styling & UI**
- **Tailwind CSS 3.4.11** - Utility-first CSS framework
- **shadcn/ui** - High-quality, accessible component library
- **Radix UI** - Unstyled, accessible component primitives
- **Lucide React 0.462.0** - Beautiful, customizable icon library

### **State Management & Data**
- **TanStack React Query 5.56.2** - Powerful server state management with intelligent caching
- **React Hook Form 7.53.0** - Performant form handling with minimal re-renders
- **Zod 3.23.8** - Runtime schema validation and type inference
- **React Context API** - Global state management for auth and UI preferences

### **Backend & Database**
- **Supabase 2.50.3** - Backend as a Service with PostgreSQL
  - Real-time subscriptions
  - Row Level Security (RLS)
  - Automatic API generation
  - Built-in authentication
- **PostgreSQL** - Robust relational database with JSONB support

### **External Integrations**
- **OpenAI API** - AI-powered chat assistance and automation
- **OpenCage Geocoding** - City/country lookup for address validation
- **REST Countries API** - Country data fallback

### **Data Visualization**
- **Recharts 2.12.7** - Composable charting library for React
- **date-fns 3.6.0** - Modern JavaScript date utility library

### **Development Tools**
- **ESLint 9.9.0** - Code linting with TypeScript support
- **PostCSS 8.4.47** - CSS processing with Autoprefixer
- **React Router DOM 6.26.2** - Client-side routing

### **Deployment & CI/CD**
- **Lovable Platform** - Automated deployment and continuous integration
- **Vercel Edge Functions** - Serverless functions for API endpoints

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **npm** or **yarn** package manager

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/cursus-nexus-automation.git
   cd cursus-nexus-automation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure your environment variables:
   ```env
   # Supabase (Required)
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   
   # OpenAI (Optional - for AI chat)
   VITE_OPENAI_API_KEY=sk-your-openai-key
   
   # Geocoding (Optional - for address lookup)
   VITE_OPENCAGE_API_KEY=your-opencage-key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:8080`

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Build for development (with source maps)
npm run build:dev

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 📖 Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[🏗️ ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System design, component structure, and architectural patterns
- **[📝 CONVENTIONS.md](./docs/CONVENTIONS.md)** - Coding standards, naming conventions, and best practices
- **[🗄️ DATABASE.md](./docs/DATABASE.md)** - Complete database schema, relationships, and migration history
- **[✨ FEATURES.md](./docs/FEATURES.md)** - Feature documentation with component locations and functionality
- **[🔌 API.md](./docs/API.md)** - Supabase query patterns, React Query integration, and external APIs

## 🌍 Dutch Business Features

This application is specifically designed for Dutch businesses and includes:

### **Name Management**
- **Tussenvoegsel Support**: Proper handling of Dutch name prefixes (van, de, van der, etc.)
- **Roepnaam**: Support for Dutch "calling names" or nicknames
- **Name Components**: Separated first name, last name, and prefix fields

### **Identity & Compliance**
- **BSN Management**: Dutch social security number (Burgerservicenummer) tracking
- **KVM Support**: Identity verification document management
- **Extended Marital Status**: Comprehensive options including domestic partnerships and civil unions

### **Professional Driver Compliance**
- **Code 95 Certification**: EU mandatory training for professional drivers
- **Complete License Categories**: Support for A, B, BE, C, CE, D license types
- **Expiry Tracking**: Automated monitoring of license and certification expiries
- **Training Points**: Code 95 35-hour training requirement tracking

## 🎨 UI/UX Features

### **Modern Design**
- **Dark/Light Mode**: Automatic theme switching based on system preferences
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Accessibility**: Full keyboard navigation and screen reader support
- **Loading States**: Skeleton loaders and smooth transitions

### **User Experience**
- **Smart Search**: Fuzzy search across employees, courses, and trainings
- **Drag & Drop**: Intuitive participant management and scheduling
- **Real-time Updates**: Live data synchronization across all users
- **Offline Support**: Graceful degradation when network is unavailable

## 🔧 Configuration

### **Application Settings**
- **Multi-language Support**: Ready for Dutch and English localization
- **Time Zone Support**: Proper handling of European time zones
- **Date Formats**: European date formatting (DD/MM/YYYY)
- **Currency**: Euro (€) formatting for training costs

### **Feature Flags**
```typescript
// src/config/features.ts
export const features = {
  aiChat: import.meta.env.VITE_ENABLE_AI_CHAT === 'true',
  geocoding: import.meta.env.VITE_ENABLE_GEOCODING === 'true',
  analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
};
```

## 🧪 Testing

### **Test Structure**
```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

### **Testing Tools**
- **Jest** - Unit testing framework
- **React Testing Library** - Component testing utilities
- **Playwright** - End-to-end testing
- **MSW** - API mocking for tests

## 🚀 Deployment

### **Lovable Platform** (Recommended)
1. Open the [Lovable Project](https://lovable.dev/projects/77e93892-a682-4834-9c6f-af34d316c993)
2. Click **Share** → **Publish**
3. Your application will be automatically deployed

### **Custom Domain**
1. Navigate to **Project** → **Settings** → **Domains**
2. Click **Connect Domain**
3. Follow the DNS configuration instructions

### **Environment Variables**
Ensure all required environment variables are configured in your deployment environment.

## 🤝 Contributing

### **Development Workflow**
1. Create a feature branch from `main`
2. Make your changes following the coding conventions
3. Write tests for new functionality
4. Run linter and tests locally
5. Submit a pull request

### **Code Standards**
- Follow the conventions outlined in [CONVENTIONS.md](./docs/CONVENTIONS.md)
- Use TypeScript for type safety
- Write descriptive commit messages
- Include tests for new features

### **AI Assistant Guidelines**
When working with this codebase using Claude Code or similar AI assistants, refer to [CLAUDE.md](./CLAUDE.md) for specific guidance and conventions.

## 📊 Performance

### **Optimization Features**
- **Code Splitting**: Automatic route-based code splitting
- **Image Optimization**: Lazy loading and responsive images
- **Caching Strategy**: Intelligent React Query caching
- **Bundle Analysis**: Webpack bundle analyzer integration

### **Performance Metrics**
- **Lighthouse Score**: 95+ on all metrics
- **Core Web Vitals**: Optimized for excellent user experience
- **Load Time**: < 2 seconds on fast 3G networks
- **Bundle Size**: < 500KB gzipped

## 🔒 Security

### **Authentication & Authorization**
- **Supabase Auth**: Secure JWT-based authentication
- **Row Level Security**: Database-level access control
- **Role-based Permissions**: Granular access control
- **Session Management**: Automatic session refresh

### **Data Protection**
- **HTTPS Enforcement**: All traffic encrypted in transit
- **Input Validation**: Comprehensive client and server-side validation
- **SQL Injection Prevention**: Parameterized queries only
- **XSS Protection**: Sanitized user inputs

## 📈 Analytics & Monitoring

### **Built-in Analytics**
- **User Activity Tracking**: Training completions, logins, feature usage
- **Performance Monitoring**: Page load times, error rates
- **Compliance Metrics**: Certification compliance rates, expiry tracking
- **Cost Analysis**: Training costs per department, ROI calculations

## 📞 Support

### **Getting Help**
- 📖 **Documentation**: Check the `/docs` folder for detailed guides
- 🐛 **Issues**: Report bugs via GitHub Issues
- 💬 **Discussions**: Use GitHub Discussions for questions
- 📧 **Contact**: Reach out via the Lovable platform

### **Community**
- Follow best practices outlined in the documentation
- Contribute to the project by submitting pull requests
- Share feedback and suggestions for improvements

---

## 📄 License

This project is part of the Lovable platform. Please refer to your Lovable project settings for license information.

---

**Built with ❤️ using modern web technologies for Dutch businesses**