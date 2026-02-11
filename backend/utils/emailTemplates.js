const emailTemplates = {
    orderConfirmation: (order) => `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #ff4d4d; margin: 0;">Bhojan</h1>
                <p style="color: #666; font-size: 14px; margin-top: 5px;">Deliciousness Delivered.</p>
            </div>
            <h2 style="color: #333;">Order Confirmed!</h2>
            <p>Hi ${order.user.fullname}, your order <b>#${order._id.toString().slice(-6).toUpperCase()}</b> has been placed successfully.</p>
            
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; font-size: 16px;">Order Summary:</h3>
                <ul style="list-style: none; padding: 0;">
                    ${order.items.map(item => `
                        <li style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span>${item.name} x ${item.quantity}</span>
                            <span style="font-weight: bold;">₹${item.price * item.quantity}</span>
                        </li>
                    `).join('')}
                </ul>
                <hr style="border: 0; border-top: 1px solid #ddd;">
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px;">
                    <span>Total Amount:</span>
                    <span>₹${order.totalAmount}</span>
                </div>
            </div>
            
            <p style="font-size: 14px; color: #666;">View live tracking on our portal.</p>
            <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL}/profile" style="background: #ff4d4d; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Track Order</a>
            </div>
            <p style="margin-top: 40px; font-size: 12px; color: #999; text-align: center;">&copy; 2026 Bhojan. All rights reserved.</p>
        </div>
    `,
    statusUpdate: (order, status) => `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #333;">Order Status Update</h2>
            <p>Your order <b>#${order._id.toString().slice(-6).toUpperCase()}</b> is now <b>${status}</b>!</p>
            <p>Our fleet is working fast to get your food to you.</p>
            <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL}/profile" style="background: #ff4d4d; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Check Status</a>
            </div>
        </div>
    `
};

module.exports = emailTemplates;
