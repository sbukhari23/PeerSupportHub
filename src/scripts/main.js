/**/**

 * Main Application Controller * Main Application Entry Point

 * Following MIT 6.102 principles and Week 6: DOM Manipulation and Events * Following MIT 6.102 Software Construction principles

 * Week 5-8: JavaScript implementation following curriculum progression */

 */

import { AuthService } from './auth.js';

// Application singleton class (MIT 6.102: Design Patterns)import { HabitService } from './habits.js';

class PeerSupportHubApp {import { NotificationService } from './notifications.js';

  constructor() {

    this.authService = null;/**

    this.habitService = null; * Main Application Class

    this.notificationService = null; * 

    this.currentUser = null; * Abstraction Function:

    this.isInitialized = false; *   AF(app) = A peer support application that coordinates authentication,

     *   habit tracking, notifications, and user interface interactions

    // Bind methods to maintain context * 

    this.init = this.init.bind(this); * Representation Invariant:

    this.handleRouting = this.handleRouting.bind(this); *   - Only one instance of App exists (singleton pattern)

    this.updateUI = this.updateUI.bind(this); *   - Services are initialized before being used

  } *   - DOM elements are available before manipulation

 */

  /**class PeerSupportApp {

   * Initialize the application  private static instance: PeerSupportApp | null = null;

   * @effects Sets up event listeners, services, and initial state  private authService: AuthService;

   */  private habitService: HabitService | null = null;

  async init() {  private notificationService: NotificationService;

    try {  private isInitialized: boolean = false;

      console.log('🚀 Initializing PeerSupportHub...');

  private constructor() {

      // Wait for DOM to be ready    this.authService = new AuthService();

      if (document.readyState === 'loading') {    this.notificationService = new NotificationService();

        document.addEventListener('DOMContentLoaded', () => this.init());    

        return;    // Listen for authentication events

      }    window.addEventListener('auth:login', this.handleLogin.bind(this));

    window.addEventListener('auth:logout', this.handleLogout.bind(this));

      // Initialize services    window.addEventListener('auth:sessionExpired', this.handleSessionExpired.bind(this));

      this.authService = new AuthService();  }

      this.habitService = new HabitService();

      this.notificationService = new NotificationService();  /**

   * Gets the singleton instance of the application

      // Check authentication status   * 

      if (this.authService.isAuthenticated()) {   * @ensures returns the same instance on subsequent calls

        this.currentUser = this.authService.getCurrentUser();   * @returns the singleton PeerSupportApp instance

        window.PeerSupportApp.AppState.setState({   */

          user: this.currentUser,  public static getInstance(): PeerSupportApp {

          isAuthenticated: true    if (!PeerSupportApp.instance) {

        });      PeerSupportApp.instance = new PeerSupportApp();

      }    }

    return PeerSupportApp.instance;

      // Set up routing and navigation  }

      this.setupRouting();

        /**

      // Set up global event listeners   * Initializes the application

      this.setupEventListeners();   * 

         * @ensures all services are properly initialized

      // Initialize page-specific functionality   * @ensures UI event listeners are attached

      this.initializePage();   * @ensures user authentication state is checked

   */

      // Subscribe to state changes  public async initialize(): Promise<void> {

      window.PeerSupportApp.AppState.subscribe((state, prevState) => {    if (this.isInitialized) {

        this.updateUI(state, prevState);      return;

      });    }



      this.isInitialized = true;    try {

      console.log('✅ PeerSupportHub initialized successfully');      // Check if user is already authenticated

      if (this.authService.isAuthenticated()) {

    } catch (error) {        const user = this.authService.getCurrentUser();

      console.error('❌ Failed to initialize PeerSupportHub:', error);        if (user) {

      this.handleError(error);          this.habitService = new HabitService(user.id);

    }          await this.loadUserDashboard();

  }        }

      }

  /**

   * Set up global event listeners (Week 6: Events)      // Initialize UI components

   */      this.initializeUI();

  setupEventListeners() {      

    // Form submission handlers      // Set up service worker for offline functionality

    document.addEventListener('submit', this.handleFormSubmit.bind(this));      await this.initializeServiceWorker();

          

    // Button click handlers      this.isInitialized = true;

    document.addEventListener('click', this.handleButtonClick.bind(this));      console.log('PeerSupportApp initialized successfully');

        } catch (error) {

    // Online/offline status      console.error('Failed to initialize application:', error);

    window.addEventListener('online', () => {      this.notificationService.showError('Failed to initialize application');

      this.notificationService?.showSuccess('Connection restored');    }

    });  }

    

    window.addEventListener('offline', () => {  /**

      this.notificationService?.showWarning('You are offline. Some features may not work.');   * Handles successful user login

    });   * 

  }   * @param event - login event containing user data

   * @ensures habit service is initialized for the user

  /**   * @ensures user dashboard is loaded

   * Handle form submissions (Week 6: Events)   */

   * @param {Event} event - Form submit event  private async handleLogin(event: CustomEvent): Promise<void> {

   */    const user = event.detail.user;

  async handleFormSubmit(event) {    

    const form = event.target;    try {

          this.habitService = new HabitService(user.id);

    // Handle login form      await this.loadUserDashboard();

    if (form.id === 'login-form') {      

      event.preventDefault();      this.notificationService.showSuccess(`Welcome back, ${user.firstName}!`);

      await this.handleLogin(form);      

    }      // Redirect to dashboard if on auth pages

          if (this.isOnAuthPage()) {

    // Handle registration form        window.location.href = '/pages/dashboard.html';

    else if (form.id === 'register-form') {      }

      event.preventDefault();    } catch (error) {

      await this.handleRegistration(form);      console.error('Error handling login:', error);

    }      this.notificationService.showError('Failed to load user data');

  }    }

  }

  /**

   * Handle button clicks  /**

   * @param {Event} event - Click event   * Handles user logout

   */   * 

  async handleButtonClick(event) {   * @ensures all user data is cleared

    const button = event.target.closest('button');   * @ensures user is redirected to home page

    if (!button) return;   */

  private handleLogout(): void {

    const action = button.getAttribute('data-action');    this.habitService = null;

        this.clearUserData();

    switch (action) {    

      case 'logout':    this.notificationService.showInfo('You have been logged out');

        await this.handleLogout();    

        break;    // Redirect to home page if on protected pages

      default:    if (this.isOnProtectedPage()) {

        break;      window.location.href = '/';

    }    }

  }  }



  /**  /**

   * Handle login form submission   * Handles session expiration

   * @param {HTMLFormElement} form - Login form element   * 

   */   * @ensures user is notified of session expiration

  async handleLogin(form) {   * @ensures user is redirected to login page

    try {   */

      const formData = new FormData(form);  private handleSessionExpired(): void {

      const email = formData.get('email');    this.habitService = null;

      const password = formData.get('password');    this.clearUserData();

      const rememberMe = formData.get('remember-me') === 'on';    

    this.notificationService.showWarning('Your session has expired. Please log in again.');

      // Show loading state    

      window.PeerSupportApp.AppState.setState({ loading: true, error: null });    setTimeout(() => {

      window.location.href = '/pages/login.html';

      const result = await this.authService.login(email, password, rememberMe);    }, 3000);

  }

      if (result.success) {

        this.currentUser = result.user;  /**

        this.notificationService.showSuccess('Welcome back!');   * Initializes UI components and event listeners

        window.location.href = '/pages/dashboard.html';   * 

      } else {   * @ensures all interactive elements have proper event handlers

        throw new Error(result.error);   * @ensures accessibility features are enabled

      }   */

  private initializeUI(): void {

    } catch (error) {    // Mobile navigation toggle

      console.error('Login error:', error);    const sidebarToggle = document.querySelector('.sidebar-toggle');

      this.notificationService.showError(error.message);    const sidebar = document.querySelector('.sidebar');

      window.PeerSupportApp.AppState.setState({ error: error.message });    

    } finally {    if (sidebarToggle && sidebar) {

      window.PeerSupportApp.AppState.setState({ loading: false });      sidebarToggle.addEventListener('click', () => {

    }        sidebar.classList.toggle('sidebar-open');

  }      });

    }

  /**

   * Handle registration form submission    // Modal management

   * @param {HTMLFormElement} form - Registration form element    this.initializeModals();

   */    

  async handleRegistration(form) {    // Form validation

    try {    this.initializeFormValidation();

      const formData = new FormData(form);    

      const userData = {    // Navigation accessibility

        email: formData.get('email'),    this.initializeNavigation();

        password: formData.get('password'),    

        confirmPassword: formData.get('confirm-password'),    // Dark mode toggle

        username: formData.get('username'),    this.initializeThemeToggle();

        fullName: formData.get('full-name'),  }

        dateOfBirth: formData.get('date-of-birth')

      };  /**

   * Initializes modal dialogs with proper accessibility

      // Show loading state   */

      window.PeerSupportApp.AppState.setState({ loading: true, error: null });  private initializeModals(): void {

    const modals = document.querySelectorAll('.modal');

      const result = await this.authService.register(userData);    

    modals.forEach(modal => {

      if (result.success) {      const closeButtons = modal.querySelectorAll('.modal-close, [data-dismiss="modal"]');

        this.currentUser = result.user;      const backdrop = modal.querySelector('.modal-backdrop');

        this.notificationService.showSuccess(result.message || 'Account created successfully!');      

        window.location.href = '/pages/dashboard.html';      closeButtons.forEach(button => {

      } else {        button.addEventListener('click', () => this.closeModal(modal as HTMLElement));

        throw new Error(result.error);      });

      }      

      if (backdrop) {

    } catch (error) {        backdrop.addEventListener('click', () => this.closeModal(modal as HTMLElement));

      console.error('Registration error:', error);      }

      this.notificationService.showError(error.message);      

      window.PeerSupportApp.AppState.setState({ error: error.message });      // Escape key to close modal

    } finally {      modal.addEventListener('keydown', (e) => {

      window.PeerSupportApp.AppState.setState({ loading: false });        if (e.key === 'Escape') {

    }          this.closeModal(modal as HTMLElement);

  }        }

      });

  /**    });

   * Handle logout  }

   */

  async handleLogout() {  /**

    try {   * Opens a modal dialog with proper focus management

      await this.authService.logout();   * 

      this.currentUser = null;   * @param modalId - ID of the modal to open

      this.notificationService.showSuccess('You have been logged out');   * @ensures modal is visible and accessible

      window.location.href = '/';   * @ensures focus is trapped within modal

    } catch (error) {   */

      console.error('Logout error:', error);  public openModal(modalId: string): void {

      this.notificationService.showError('Logout failed. Please try again.');    const modal = document.getElementById(modalId);

    }    if (!modal) return;

  }

    modal.classList.remove('hidden');

  /**    modal.setAttribute('aria-hidden', 'false');

   * Update UI based on state changes    

   * @param {Object} state - Current application state    // Focus first focusable element

   * @param {Object} prevState - Previous application state    const focusableElements = modal.querySelectorAll(

   */      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

  updateUI(state, prevState) {    );

    // Update loading states    

    if (state.loading !== prevState.loading) {    if (focusableElements.length > 0) {

      this.updateLoadingUI(state.loading);      (focusableElements[0] as HTMLElement).focus();

    }    }

    

    // Update error states    // Prevent body scroll

    if (state.error !== prevState.error) {    document.body.style.overflow = 'hidden';

      this.updateErrorUI(state.error);  }

    }

  }  /**

   * Closes a modal dialog

  /**   * 

   * Update loading UI   * @param modal - modal element to close

   * @param {boolean} isLoading - Loading state   * @ensures modal is hidden and inaccessible

   */   * @ensures body scroll is restored

  updateLoadingUI(isLoading) {   */

    const loadingElements = document.querySelectorAll('.loading-spinner');  public closeModal(modal: HTMLElement): void {

    const submitButtons = document.querySelectorAll('button[type="submit"]');    modal.classList.add('hidden');

        modal.setAttribute('aria-hidden', 'true');

    loadingElements.forEach(el => {    

      el.style.display = isLoading ? 'block' : 'none';    // Restore body scroll

    });    document.body.style.overflow = '';

      }

    submitButtons.forEach(btn => {

      btn.disabled = isLoading;  /**

      btn.textContent = isLoading ? 'Loading...' : btn.getAttribute('data-original-text') || btn.textContent;   * Initializes form validation with real-time feedback

    });   */

  }  private initializeFormValidation(): void {

    const forms = document.querySelectorAll('form[novalidate]');

  /**    

   * Update error UI    forms.forEach(form => {

   * @param {string} error - Error message      const inputs = form.querySelectorAll('input, select, textarea');

   */      

  updateErrorUI(error) {      inputs.forEach(input => {

    const errorElements = document.querySelectorAll('.error-message');        input.addEventListener('blur', () => this.validateField(input as HTMLElement));

            input.addEventListener('input', () => this.clearFieldError(input as HTMLElement));

    errorElements.forEach(el => {      });

      if (error) {      

        el.textContent = error;      form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        el.style.display = 'block';    });

      } else {  }

        el.style.display = 'none';

      }  /**

    });   * Validates a form field and displays errors

  }   * 

   * @param field - form field to validate

  /**   * @ensures validation state is visually indicated

   * Initialize page-specific functionality   * @ensures error message is accessible

   */   */

  initializePage() {  private validateField(field: HTMLElement): boolean {

    // Common initialization for all pages    const input = field as HTMLInputElement;

    this.initializeCommonFeatures();    const errorElement = document.getElementById(`${input.name}-error`);

  }    

    if (!errorElement) return true;

  /**

   * Initialize common features    let isValid = true;

   */    let errorMessage = '';

  initializeCommonFeatures() {

    // Store original button text for loading states    // Required field validation

    const submitButtons = document.querySelectorAll('button[type="submit"]');    if (input.hasAttribute('required') && !input.value.trim()) {

    submitButtons.forEach(btn => {      isValid = false;

      btn.setAttribute('data-original-text', btn.textContent);      errorMessage = 'This field is required';

    });    }

  }    

    // Email validation

  /**    if (input.type === 'email' && input.value && !this.isValidEmail(input.value)) {

   * Handle application errors      isValid = false;

   * @param {Error} error - Error object      errorMessage = 'Please enter a valid email address';

   */    }

  handleError(error) {    

    console.error('Application error:', error);    // Password validation

        if (input.type === 'password' && input.value) {

    // Update UI to show error state      const strength = this.calculatePasswordStrength(input.value);

    window.PeerSupportApp.AppState.setState({      if (strength < 3) {

      error: error.message,        isValid = false;

      loading: false        errorMessage = 'Password is too weak';

    });      }

        }

    // Show user-friendly error message

    if (this.notificationService) {    // Update UI

      this.notificationService.showError('Something went wrong. Please try again.');    if (isValid) {

    }      input.classList.remove('error');

  }      errorElement.textContent = '';

}      errorElement.classList.add('hidden');

    } else {

// Create global app instance      input.classList.add('error');

const app = new PeerSupportHubApp();      errorElement.textContent = errorMessage;

      errorElement.classList.remove('hidden');

// Auto-initialize when DOM is ready    }

if (document.readyState === 'loading') {

  document.addEventListener('DOMContentLoaded', () => app.init());    return isValid;

} else {  }

  app.init();

}  /**

   * Clears error state for a form field

// Export for module usage   */

if (typeof module !== 'undefined' && module.exports) {  private clearFieldError(field: HTMLElement): void {

  module.exports = PeerSupportHubApp;    const input = field as HTMLInputElement;

}    const errorElement = document.getElementById(`${input.name}-error`);

    

// Make available globally    if (errorElement && input.classList.contains('error')) {

window.PeerSupportHubApp = app;      input.classList.remove('error');
      errorElement.textContent = '';
      errorElement.classList.add('hidden');
    }
  }

  /**
   * Handles form submission with validation
   */
  private handleFormSubmit(event: Event): void {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const inputs = form.querySelectorAll('input, select, textarea');
    let isFormValid = true;

    // Validate all fields
    inputs.forEach(input => {
      if (!this.validateField(input as HTMLElement)) {
        isFormValid = false;
      }
    });

    if (isFormValid) {
      // Dispatch custom event for form handling
      const formEvent = new CustomEvent('formValid', {
        detail: { form, data: new FormData(form) }
      });
      window.dispatchEvent(formEvent);
    } else {
      // Focus first invalid field
      const firstError = form.querySelector('.error');
      if (firstError) {
        (firstError as HTMLElement).focus();
      }
    }
  }

  /**
   * Initializes keyboard navigation
   */
  private initializeNavigation(): void {
    // Skip link functionality
    const skipLink = document.querySelector('.sr-only');
    if (skipLink) {
      skipLink.addEventListener('focus', () => {
        skipLink.classList.remove('sr-only');
      });
      
      skipLink.addEventListener('blur', () => {
        skipLink.classList.add('sr-only');
      });
    }

    // Navigation keyboard support
    const navItems = document.querySelectorAll('.nav-link');
    navItems.forEach(item => {
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          (item as HTMLElement).click();
        }
      });
    });
  }

  /**
   * Initializes theme toggle functionality
   */
  private initializeThemeToggle(): void {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
      });
    }
  }

  /**
   * Initializes service worker for offline functionality
   */
  private async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.warn('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Loads user dashboard data
   */
  private async loadUserDashboard(): Promise<void> {
    if (!this.habitService) return;

    try {
      // Load user habits
      const habitsResponse = await this.habitService.getUserHabits();
      if (habitsResponse.success && habitsResponse.data) {
        this.updateHabitsDisplay(habitsResponse.data);
      }

      // Load today's progress
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const logsResponse = await this.habitService.getHabitLogs(today, tomorrow);
      if (logsResponse.success && logsResponse.data) {
        this.updateProgressDisplay(logsResponse.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  /**
   * Updates habits display in the UI
   */
  private updateHabitsDisplay(habits: any[]): void {
    const habitsList = document.getElementById('todays-habits-list');
    if (!habitsList) return;

    // Implementation would update the habits list
    // This is a placeholder for the actual implementation
  }

  /**
   * Updates progress display in the UI
   */
  private updateProgressDisplay(logs: any[]): void {
    const progressBar = document.querySelector('.progress-fill') as HTMLElement;
    if (!progressBar) return;

    // Implementation would update progress indicators
    // This is a placeholder for the actual implementation
  }

  // Utility methods

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private calculatePasswordStrength(password: string): number {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    return strength;
  }

  private isOnAuthPage(): boolean {
    return window.location.pathname.includes('/login') || 
           window.location.pathname.includes('/register');
  }

  private isOnProtectedPage(): boolean {
    return window.location.pathname.includes('/dashboard') ||
           window.location.pathname.includes('/habits') ||
           window.location.pathname.includes('/peers') ||
           window.location.pathname.includes('/profile');
  }

  private clearUserData(): void {
    // Clear any cached user data
    localStorage.removeItem('psh_user');
    localStorage.removeItem('psh_token');
    localStorage.removeItem('psh_expires');
  }

  // Public API methods

  public getAuthService(): AuthService {
    return this.authService;
  }

  public getHabitService(): HabitService | null {
    return this.habitService;
  }

  public getNotificationService(): NotificationService {
    return this.notificationService;
  }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const app = PeerSupportApp.getInstance();
  await app.initialize();
  
  // Make app globally available for debugging
  (window as any).app = app;
});

// Export for module usage
export { PeerSupportApp };