#!/usr/bin/env python3
"""
Test the trivia app game flow:
1. Try to login as host (host1@example.com), register if needed
2. Create a new game
3. Navigate to game welcome screen
"""

from playwright.sync_api import sync_playwright
import time
import os

def test_game_flow():
    # Create ./tmp directory if it doesn't exist
    os.makedirs('./tmp', exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Enable console logging to catch any errors
        def handle_console(msg):
            print(f"[CONSOLE {msg.type}] {msg.text}")

        def handle_error(exc):
            print(f"[PAGE ERROR] {exc}")

        page.on("console", handle_console)
        page.on("pageerror", handle_error)

        try:
            print("🚀 Navigating to app at http://localhost:5173")
            page.goto('http://localhost:5173', timeout=10000)
            page.wait_for_load_state('networkidle')

            # Take initial screenshot
            print("📸 Taking initial screenshot...")
            page.screenshot(path='../tmp/01_initial_page.png', full_page=True)

            # Check if we're on the login page
            print("🔍 Looking for login form...")

            # Wait a moment for any redirects
            time.sleep(1)

            # Take screenshot of current state
            page.screenshot(path='./tmp/02_current_state.png', full_page=True)
            print(f"📍 Current URL: {page.url}")

            # Credentials
            test_email = 'host1@example.com'
            test_password = 'Password123!'

            # Try to find email input field
            email_input = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first
            if email_input.is_visible(timeout=2000):
                print("✅ Found email input field")

                # Fill in login credentials
                print(f"📝 Attempting login with {test_email}...")
                email_input.fill(test_email)

                # Find password field
                password_input = page.locator('input[type="password"]').first
                password_input.fill(test_password)

                page.screenshot(path='./tmp/03_credentials_filled.png', full_page=True)

                # Find and click login button
                print("🔘 Looking for login button...")
                login_button = page.locator('button:has-text("Login"), button:has-text("Sign in"), button:has-text("Log in")').first
                login_button.click()

                print("⏳ Waiting for login to complete...")
                page.wait_for_load_state('networkidle')
                time.sleep(2)  # Wait for any animations/redirects

                page.screenshot(path='./tmp/04_after_login_attempt.png', full_page=True)
                print(f"📍 After login attempt URL: {page.url}")

                # Check if login was successful or if we need to register
                if page.url == 'http://localhost:5173/' or 'error' in page.content().lower() or 'invalid' in page.content().lower():
                    print("⚠️  Login failed - user may not exist. Attempting registration...")

                    # Look for registration link or switch to register mode
                    register_link = page.locator('a:has-text("Register"), a:has-text("Sign up"), button:has-text("Register"), button:has-text("Sign up")').first

                    if register_link.is_visible(timeout=2000):
                        print("✅ Found registration link")
                        register_link.click()
                        page.wait_for_load_state('networkidle')
                        time.sleep(1)

                        page.screenshot(path='./tmp/04b_registration_page.png', full_page=True)

                        # Fill in registration form
                        print("📝 Filling registration form...")

                        # Find and fill email
                        reg_email_input = page.locator('input[type="email"], input[name="email"]').first
                        reg_email_input.fill(test_email)

                        # Find and fill name field
                        name_input = page.locator('input[name="name"], input[placeholder*="name" i]').first
                        if name_input.is_visible(timeout=1000):
                            name_input.fill('Test Host 1')
                            print("✅ Filled name field")

                        # Find and fill password (might have confirm password too)
                        password_inputs = page.locator('input[type="password"]').all()
                        for pwd_input in password_inputs:
                            if pwd_input.is_visible():
                                pwd_input.fill(test_password)

                        # Select Host role if available
                        host_button = page.locator('button:has-text("Host")').first
                        if host_button.is_visible(timeout=1000):
                            host_button.click()
                            print("✅ Selected Host role")
                            time.sleep(0.5)

                        page.screenshot(path='./tmp/04c_registration_filled.png', full_page=True)

                        # Click create account button
                        register_button = page.locator('button:has-text("Create Account"), button:has-text("Register"), button:has-text("Sign up")').first
                        register_button.click()

                        print("⏳ Waiting for registration to complete...")
                        page.wait_for_load_state('networkidle')
                        time.sleep(2)

                        page.screenshot(path='./tmp/04d_after_registration.png', full_page=True)
                        print(f"📍 After registration URL: {page.url}")

                        # After registration, we might be automatically logged in or need to login
                        # Check if we're on the lobby/host page or still on auth page
                        if page.url == 'http://localhost:5173/':
                            print("📝 Need to login after registration...")
                            # Fill in login form again
                            login_email = page.locator('input[type="email"]').first
                            if login_email.is_visible(timeout=2000):
                                login_email.fill(test_email)
                                login_pwd = page.locator('input[type="password"]').first
                                login_pwd.fill(test_password)

                                # Click Host login button if present
                                host_login = page.locator('button:has-text("Host")').first
                                if host_login.is_visible(timeout=1000):
                                    host_login.click()
                                    time.sleep(0.5)

                                # Click sign in
                                signin_button = page.locator('button:has-text("Sign In"), button:has-text("Login")').first
                                signin_button.click()

                                page.wait_for_load_state('networkidle')
                                time.sleep(2)

                                page.screenshot(path='./tmp/04e_after_post_registration_login.png', full_page=True)
                                print(f"📍 After post-registration login URL: {page.url}")
                    else:
                        print("❌ Could not find registration link")

                page.screenshot(path='./tmp/04_after_login.png', full_page=True)
                print(f"📍 After login URL: {page.url}")

                # Navigate to host page
                print("🏠 Navigating to host page...")
                page.goto('http://localhost:5173/host')
                page.wait_for_load_state('networkidle')
                time.sleep(1)

                page.screenshot(path='./tmp/05_host_page.png', full_page=True)
                print(f"📍 Host page URL: {page.url}")

                # Look for game creation interface
                print("🎮 Looking for game creation option...")

                # Common patterns for creating new games
                create_button = page.locator(
                    'button:has-text("New Game"), '
                    'button:has-text("Create Game"), '
                    'button:has-text("Create"), '
                    'a:has-text("New Game"), '
                    '[data-testid="create-game"]'
                ).first

                if create_button.is_visible(timeout=5000):
                    print("✅ Found game creation button")
                    page.screenshot(path='./tmp/06_before_create_click.png', full_page=True)

                    create_button.click()
                    print("⏳ Waiting for game creation form...")
                    page.wait_for_load_state('networkidle')
                    time.sleep(1)

                    # Wait for modal/dialog to appear
                    print("⏳ Waiting for modal dialog...")
                    try:
                        page.wait_for_selector('[role="dialog"], .modal, dialog', timeout=5000)
                        print("✅ Modal appeared")
                    except:
                        print("⚠️  Modal might not have role=dialog")

                    time.sleep(1)
                    page.screenshot(path='./tmp/07_game_creation_form.png', full_page=True)
                    print(f"📍 Game creation URL: {page.url}")

                    # Try different strategies to find the name input
                    print("🔍 Looking for name input field...")

                    # Try finding all inputs and take the first one
                    name_input = None
                    try:
                        # Look for any input element - the first one should be the name field
                        all_inputs = page.locator('input').all()
                        print(f"📋 Found {len(all_inputs)} input fields")

                        if len(all_inputs) > 0:
                            name_input = all_inputs[0]  # First input should be the Name field
                            if name_input.is_visible():
                                print("✅ Found name input field (first input)")
                    except Exception as e:
                        print(f"⚠️  Error locating inputs: {e}")

                    if name_input and name_input.is_visible():
                        print("📝 Filling in game name...")
                        name_input.fill('Test Game - Automated')
                        time.sleep(0.5)
                        page.screenshot(path='./tmp/08_game_name_filled.png', full_page=True)

                        # Look for Create Game button (not just "Create")
                        print("🔘 Looking for Create Game button...")
                        create_game_btn = page.locator('button:has-text("Create Game")').first

                        if create_game_btn.is_visible(timeout=2000):
                            print("✅ Found Create Game button, clicking...")
                            create_game_btn.click()
                            print("⏳ Waiting for game to be created...")
                            page.wait_for_load_state('networkidle')
                            time.sleep(2)

                            page.screenshot(path='./tmp/09_game_created.png', full_page=True)
                            print(f"📍 After creation URL: {page.url}")
                            print("✅ Game creation flow completed!")

                            # Wait for modal to close by checking if the "Create Game" dialog disappears
                            print("⏳ Waiting for modal to close...")
                            try:
                                # Wait for the modal to disappear
                                page.wait_for_selector('[role="dialog"]', state='hidden', timeout=5000)
                                print("✅ Modal closed")
                            except:
                                # If that doesn't work, try waiting for "Saving..." to disappear
                                print("⏳ Waiting for save to complete...")
                                time.sleep(3)

                            page.screenshot(path='./tmp/10_modal_closed.png', full_page=True)

                            # Check if we can see the game in the list
                            if 'Test Game - Automated' in page.content():
                                print("✅ Game appears in the games list!")

                                # Look for the Play button for our game
                                print("🎮 Looking for Play button...")

                                # Wait a moment for the list to fully render
                                time.sleep(1)

                                # Take a screenshot to see what we're working with
                                page.screenshot(path='./tmp/10a_looking_for_play.png', full_page=True)

                                # Find the play button more precisely
                                play_button = None
                                try:
                                    # The play button should be a circular black button in the ACTIONS column
                                    # Look for buttons with specific styling or aria-label
                                    all_buttons = page.locator('button').all()
                                    print(f"📋 Found {len(all_buttons)} total buttons")

                                    # Try to find buttons by their background color or styling
                                    # The play button typically has a dark background
                                    for i, btn in enumerate(all_buttons):
                                        if btn.is_visible():
                                            # Get the computed style or class
                                            class_attr = btn.get_attribute('class') or ''
                                            # Play buttons often have darker styling
                                            if 'bg-black' in class_attr or 'bg-primary' in class_attr or 'dark:bg' in class_attr:
                                                # Make sure it's in the game row area (after position 2)
                                                if i > 2:
                                                    print(f"📋 Button {i} has dark styling: {class_attr[:50]}")
                                                    play_button = btn
                                                    print(f"✅ Selected button {i} as play button based on styling")
                                                    break

                                    # If that doesn't work, try finding by SVG polygon (play icon triangle)
                                    if not play_button:
                                        for i, btn in enumerate(all_buttons):
                                            if btn.is_visible() and i > 2:
                                                html = btn.inner_html()
                                                # Play button has a polygon SVG element for the triangle
                                                if 'polygon' in html and 'M5,3' in html:  # Common play icon path
                                                    play_button = btn
                                                    print(f"✅ Selected button {i} as play button based on SVG polygon")
                                                    break
                                except Exception as e:
                                    print(f"⚠️  Error finding play button: {e}")

                                if play_button and play_button.is_visible(timeout=3000):
                                    print("✅ Found Play button, clicking...")
                                    page.screenshot(path='./tmp/11_before_play_click.png', full_page=True)

                                    play_button.click()
                                    print("⏳ Waiting for game screen to load...")
                                    page.wait_for_load_state('networkidle')
                                    time.sleep(2)

                                    page.screenshot(path='./tmp/12_game_screen.png', full_page=True)
                                    print(f"📍 Game screen URL: {page.url}")

                                    # Check for "Welcome to the Game!" message
                                    if 'Welcome to the Game!' in page.content():
                                        print("✅ Successfully reached 'Welcome to the Game!' screen!")
                                    else:
                                        print("⚠️  Could not find 'Welcome to the Game!' message")
                                        print("🔍 Looking for welcome-related text...")
                                        # Check for variations
                                        if 'Welcome' in page.content():
                                            print("ℹ️  Found 'Welcome' text on page")
                                else:
                                    print("⚠️  Could not find Play button")
                                    # List available buttons for debugging
                                    buttons = page.locator('button').all()
                                    visible_buttons = [btn.text_content() for btn in buttons if btn.is_visible()]
                                    print(f"📋 Available buttons: {visible_buttons[:10]}")
                            else:
                                print("⚠️  Game not found in list")
                        else:
                            print("⚠️  Could not find Create Game button")
                            # Show available buttons
                            buttons = page.locator('button').all()
                            print(f"Available buttons: {[btn.text_content() for btn in buttons if btn.is_visible()]}")
                    else:
                        print("⚠️  Could not find or interact with name input")
                else:
                    print("⚠️  Could not find game creation button")
                    print("🔍 Checking page content for clues...")
                    # List all visible buttons
                    buttons = page.locator('button, a[role="button"]').all()
                    print(f"📋 Found {len(buttons)} buttons/links:")
                    for i, btn in enumerate(buttons[:10]):  # Limit to first 10
                        try:
                            text = btn.text_content()
                            if text and text.strip():
                                print(f"  - Button {i+1}: {text.strip()}")
                        except:
                            pass

            else:
                print("⚠️  Not on login page - might already be logged in or different flow")
                print(f"📍 Current URL: {page.url}")

                # Check if we're already on a dashboard/host page
                if '/host' in page.url or 'dashboard' in page.url.lower():
                    print("ℹ️  Appears to be already logged in, looking for game creation...")
                    page.screenshot(path='./tmp/05_already_logged_in.png', full_page=True)

            print("\n✅ Test completed! Check screenshots in ./tmp/ directory:")
            print("   ./tmp/01_initial_page.png")
            print("   ./tmp/02_current_state.png")
            print("   ./tmp/03_credentials_filled.png")
            print("   ./tmp/04_after_login.png")
            print("   ./tmp/05_*.png (and subsequent)")

        except Exception as e:
            print(f"❌ Error during test: {e}")
            page.screenshot(path='./tmp/error_screenshot.png', full_page=True)
            print("📸 Error screenshot saved to ./tmp/error_screenshot.png")
            raise
        finally:
            browser.close()

if __name__ == '__main__':
    test_game_flow()
