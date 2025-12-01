# OTP Input Component

An animated one-time password (OTP) input form built with React and Motion library.

## Features

- 6 animated digit input boxes
- Smooth entrance animations (slide from bottom, scale, fade)
- Auto-advance to next input on digit entry
- Error state with shake animation and red highlight
- Success state with icon bounce and color change
- Icon transitions from email to lock on success
- Paste support for full OTP codes
- Backspace navigation between inputs

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Testing

The correct OTP is hardcoded as `123456` for demonstration purposes.

- Enter `123456` to see the success animation
- Enter any other 6-digit code to see the error animation
