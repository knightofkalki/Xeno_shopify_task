const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const shopifyService = require('./shopifyService');

const EMAIL_ID = process.env.EMAIL_ID;
const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD;

const otpStore = new Map();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_ID,
    pass: EMAIL_APP_PASSWORD,
  },
});

class EmailService {
  // Simple email validation with Shopify (SINGLE STORE)
  async validateEmailWithShopify(email) {
    try {
      console.log('🔍 Validating email with Shopify:', email);
      
      // Get Shopify connection (single store)
      const shopifyConnection = await shopifyService.testConnection();
      if (!shopifyConnection.success) {
        throw new Error('Cannot connect to Shopify store');
      }
      
      // Get customers from Shopify
      const customers = await shopifyService.getCustomers();
      
      // Check if email is a customer
      const customer = customers.find(c => 
        c.email && c.email.toLowerCase() === email.toLowerCase()
      );
      
      if (customer) {
        return {
          valid: true,
          type: 'customer',
          customerInfo: {
            shopifyId: customer.id,
            email: customer.email,
            name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
            totalSpent: parseFloat(customer.total_spent || 0),
            ordersCount: customer.orders_count || 0
          },
          storeInfo: {
            name: shopifyConnection.shop,
            domain: shopifyConnection.domain
          }
        };
      }
      
      // Check if email is store admin
      const adminEmails = [
        shopifyConnection.email,
        'admin@xeno.com',
        'ujjwal@techmart.com'
      ].filter(Boolean);
      
      if (adminEmails.some(adminEmail => adminEmail.toLowerCase() === email.toLowerCase())) {
        return {
          valid: true,
          type: 'admin',
          storeInfo: {
            name: shopifyConnection.shop,
            domain: shopifyConnection.domain,
            email: shopifyConnection.email
          }
        };
      }
      
      return {
        valid: false,
        message: 'Email not found in Shopify store'
      };
      
    } catch (error) {
      console.error('Email validation error:', error);
      return {
        valid: false,
        message: 'Failed to validate email with Shopify'
      };
    }
  }

  // Send OTP (SIMPLIFIED)
  async sendOTP(email, tenantId = '1') {
    try {
      // Validate email with Shopify
      const validation = await this.validateEmailWithShopify(email);
      
      if (!validation.valid) {
        return {
          success: false,
          message: validation.message || 'Email not authorized for this store'
        };
      }

      // Generate OTP
      const otp = otpGenerator.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      });
      
      const otpExpires = Date.now() + 300000; // 5 minutes
      
      // Store OTP with tenant ID
      otpStore.set(email, {
        otp,
        expires: otpExpires,
        tenantId,
        userType: validation.type,
        validationData: validation,
        authorizedAt: Date.now()
      });
      
      const isCustomer = validation.type === 'customer';
      const storeName = validation.storeInfo.name;
      const userName = isCustomer ? validation.customerInfo.name : 'Store Administrator';
      
      const mailOptions = {
        to: email,
        from: EMAIL_ID,
        subject: `${storeName} - Tenant ${tenantId} Dashboard Access`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🛒 ${storeName}</h1>
            <p style="color: white; margin: 5px 0;">Tenant ${tenantId} Dashboard</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333;">Hi ${userName}! 👋</h2>
            
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 0; color: #1976d2;"><strong>🎯 Tenant Access</strong></p>
              <p style="margin: 5px 0; color: #1976d2;"><strong>Store:</strong> ${storeName}</p>
              <p style="margin: 5px 0 0 0; color: #1976d2;"><strong>Tenant ID:</strong> ${tenantId}</p>
            </div>
            
            ${isCustomer ? `
              <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p style="margin: 0; color: #2d5a2d;"><strong>✅ Verified Customer</strong></p>
                <p style="margin: 5px 0 0 0; color: #2d5a2d;">
                  💰 Total Spent: $${validation.customerInfo.totalSpent.toFixed(2)} | 
                  🛍️ Orders: ${validation.customerInfo.ordersCount}
                </p>
              </div>
            ` : `
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p style="margin: 0; color: #856404;"><strong>👑 Store Administrator</strong></p>
                <p style="margin: 5px 0 0 0; color: #856404;">Full tenant management access</p>
              </div>
            `}
            
            <p style="color: #666;">Your secure access code:</p>
            
            <div style="background: #667eea; color: white; font-size: 32px; font-weight: bold; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; letter-spacing: 8px;">
              ${otp}
            </div>
            
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px;">
              <p style="margin: 0; color: #721c24;"><strong>⏰ Valid for 5 minutes</strong></p>
              <p style="margin: 5px 0 0 0; color: #721c24;">🔒 Tenant ${tenantId} data isolation active</p>
            </div>
            
            <p style="color: #666; margin-top: 20px; font-size: 12px;">
              This OTP grants access to Tenant ${tenantId} data in ${storeName}.
              Data is isolated by tenant identifier as per multi-tenant architecture.
            </p>
          </div>
        </div>`
      };
      
      await transporter.sendMail(mailOptions);
      
      return {
        success: true,
        message: `OTP sent for ${storeName} - Tenant ${tenantId} access`,
        tenantId: tenantId,
        storeName: storeName,
        expiresIn: '5 minutes'
      };
      
    } catch (error) {
      console.error('Email send error:', error);
      return {
        success: false,
        message: 'Failed to send OTP'
      };
    }
  }
  
  // Verify OTP (SIMPLIFIED)
  verifyOTP(email, otp) {
    const storedData = otpStore.get(email);
    
    if (!storedData) {
      return {
        success: false,
        message: 'No OTP found. Please request a new OTP.'
      };
    }
    
    if (storedData.otp !== otp || storedData.expires < Date.now()) {
      return {
        success: false,
        message: 'Invalid or expired OTP'
      };
    }
    
    // Remove OTP after successful verification
    otpStore.delete(email);
    
    return {
      success: true,
      tenantId: storedData.tenantId,
      userType: storedData.userType,
      validationData: storedData.validationData,
      message: `Access granted to Tenant ${storedData.tenantId}`,
      authorizedEmail: email
    };
  }
}

module.exports = new EmailService();
