# 🔐 Admin Account Setup Guide

## 🚨 **Important Security Notice**

For security reasons, **admin accounts cannot be created through the public registration form**. Admin accounts must be created manually through the Supabase dashboard to prevent unauthorized admin access.

## 👨‍💼 **Creating Your First Admin Account**

### **Step 1: Create User Account**

1. **Go to your Supabase Dashboard**
2. **Navigate to Authentication** → **Users**
3. **Click "Add User"**
4. **Fill in the details:**
   - **Email**: Your admin email address
   - **Password**: Strong admin password
   - **Email Confirm**: ✅ (check this box)
5. **Click "Create User"**

### **Step 2: Upgrade to Admin Role**

1. **Go to Table Editor** → **users** table
2. **Find your newly created user** (search by email)
3. **Click the edit icon** (pencil) on that row
4. **Change the role field:**
   - From: `USER`
   - To: `ADMIN`
5. **Click "Save"**

### **Step 3: Verify Admin Access**

1. **Go to your live gym management app**
2. **Login with your admin credentials**
3. **You should be redirected to the Admin Dashboard**
4. **Verify you can access all admin features:**
   - Member Management
   - Billing & Payments
   - Supplement Management
   - Diet Management
   - Notifications
   - Reports & Analytics

## 🔄 **Creating Additional Admin Accounts**

Repeat the same process for any additional admin accounts you need:

1. **Create user in Supabase Authentication**
2. **Update role to ADMIN in users table**
3. **Test login and access**

## 🛡️ **Security Best Practices**

### **Admin Account Security:**
- ✅ **Use strong passwords** (12+ characters, mixed case, numbers, symbols)
- ✅ **Enable 2FA** if available in your Supabase project
- ✅ **Use unique admin emails** (don't reuse personal emails)
- ✅ **Limit admin accounts** to only necessary personnel
- ✅ **Regular password updates** (every 90 days)

### **Access Control:**
- ✅ **Document who has admin access**
- ✅ **Remove admin access** when staff leaves
- ✅ **Regular access reviews** (monthly)
- ✅ **Monitor admin activities** through Supabase logs

## 🚫 **What Regular Users Can Register As**

Through the public registration form, users can only create:

- **👤 USER**: Browse gym information, view supplement store
- **🏋️ MEMBER**: Full membership features, profile management, bills, diet plans

**❌ ADMIN**: Not available in public registration for security

## 🆘 **Troubleshooting**

### **Can't Access Admin Dashboard:**
1. **Check user role** in Supabase users table
2. **Ensure role is exactly** `ADMIN` (case-sensitive)
3. **Clear browser cache** and try logging in again
4. **Check browser console** for any error messages

### **Admin Features Not Working:**
1. **Verify RLS policies** are properly configured
2. **Check environment variables** are set correctly
3. **Ensure database tables** have proper admin permissions

### **Forgot Admin Password:**
1. **Go to Supabase Dashboard** → Authentication → Users
2. **Find the admin user** and click edit
3. **Update the password** field
4. **Save changes**
5. **Login with new password**

## 📞 **Support**

If you encounter issues with admin setup:

1. **Check Supabase logs** for authentication errors
2. **Verify database permissions** and RLS policies
3. **Test with a fresh browser session**
4. **Review the deployment guide** for any missed steps

---

**🔒 Remember: Admin access is powerful. Only grant it to trusted personnel who need full system access.**