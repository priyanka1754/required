import { Routes } from '@angular/router';
import { AuthGuard } from './auth-guard';

export const routes: Routes = [
    {
    path: '',
    loadComponent: () =>
      import('./home/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/new-users-dashboard/new-users-dashboard.component').then(
        (m) => m.NewUsersDashboardComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'one-on-one-sessions',
    loadComponent: () =>
      import('./one-on-one-sessions/one-on-one-sessions.component').then(
        (m) => m.OneOnOneSessionsComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'sellers',
    loadComponent: () =>
      import('./sellers/sellers.component').then((m) => m.SellersComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./orders/orders.component').then((m) => m.OrdersComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'view-assessments',
    loadComponent: () =>
      import('./view-assessments/view-assessments.component').then((m) => m.ViewAssessmentsComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'marketorders',
    loadComponent: () =>
      import('./orders/marketOrders/marketOrders.component').then(
        (m) => m.MarketordersComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'createOrder/:id',
    loadComponent: () =>
      import('./orders/create-order/create-order.component').then(
        (m) => m.CreateOrderComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'paymentRequests',
    loadComponent: () =>
      import('./paymentRequests/paymentRequests.component').then(
        (m) => m.paymentRequestsComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'binProducts',
    loadComponent: () =>
      import('./binProducts/binProducts.component').then(
        (m) => m.binProducts
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'connectUsers',
    loadComponent: () =>
      import('./connectUsers/connect-users.component').then(
        (m) => m.ConnectUsersComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'reviewSellerProducts',
    loadComponent: () =>
      import('./reviewSellerProducts/review-sellerproducts.component').then(
        (m) => m.reviewSellerProductsComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'coupons',
    loadComponent: () =>
      import('./coupons/coupons.component').then((m) => m.CouponsComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'createCoupon',
    loadComponent: () =>
      import('./coupons/create-coupon/create-coupon.component').then(
        (m) => m.CreateCouponComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./home/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'products/:filter/:value',
    loadComponent: () =>
      import('./products/products.component').then((m) => m.ProductsComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'product/details/:Code/:StoreCode/:id',
    loadComponent: () =>
      import('./products/product-details/product-details.component').then(
        (m) => m.ProductDetailsComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'product/form/:Code/:StoreCode/:id',
    loadComponent: () =>
      import('./products/product-form/product-form.component').then(
        (m) => m.ProductFormComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'customers',
    loadComponent: () =>
      import('./customers/customers.component').then((m) => m.CustomersComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'customers/search-history',
    loadComponent: () =>
      import('./customers/search/search.component').then((m) => m.SearchComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'stores',
    loadComponent: () =>
      import('./stores/stores.component').then((m) => m.StoresComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'store/add',
    loadComponent: () =>
      import('./stores/store-form/store-form.component').then(
        (m) => m.StoreFormComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'customer/form/:Code/:CustomerId',
    loadComponent: () =>
      import('./customers/customer-form/customer-form.component').then(
        (m) => m.CustomerFormComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'customer/wallet-history/:customerId/:customerCode',
    loadComponent: () =>
      import('./customers/wallet-history-page.component').then(
        (m) => m.WalletHistoryPageComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'store/form/:Code',
    loadComponent: () =>
      import('./stores/store-form/store-form.component').then(
        (m) => m.StoreFormComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'curatedBoxes',
    loadComponent: () =>
      import('./products/curatedBoxes/curatedBoxes.component').then(
        (m) => m.CuratedBoxesComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'magazines',
    loadComponent: () =>
      import('./magazines/magazine.component').then((m) => m.MagazineComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'magazines/create',
    loadComponent: () =>
      import('./magazines/magazine-create.component').then(
        (m) => m.MagazineCreateComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'blogs',
    loadComponent: () =>
      import('./blogs/blogs.component').then((m) => m.BlogsComponent),
     canActivate: [AuthGuard],
  },
  {
    path: 'write-blog',
    loadComponent: () =>
      import('./blogs/write-blog/write-blog.component').then(
        (m) => m.WriteBlogComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'blog-details/:id',
    loadComponent: () =>
      import('./blogs/blog-details/blog-details.component').then(
        (m) => m.BlogDetailsComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'skill-assessment',
    loadComponent: () =>
      import('./skill-assessment/skill-assessment.component').then(
        (m) => m.SkillAssessmentComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'skill-match-grid',
    loadComponent: () =>
      import('./skill-assessment/skill-match-grid.component').then(
        (m) => m.SkillMatchGridComponent
      ),
    canActivate: [AuthGuard],
  },
    {
    path: 'skill-products/:age/:skill/:skillLevel',
    loadComponent: () =>
      import('./skill-assessment/skill-products-list.component').then(
        (m) => m.SkillProductsListComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'skill-activities',
    loadComponent: () =>
      import('./skill-activities/skill-activities.component').then(
        (m) => m.SkillActivitiesComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./home/login/forgetpassword/forgetpassword.component').then(
        (m) => m.ForgetpasswordComponent
      ),
  }, // Lazy load the component
];
