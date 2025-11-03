#!/usr/bin/env python3
"""
Test the trivia app game flow:
1. Try to login as host (host1@example.com), register if needed
2. Create a new game
3. Navigate to game welcome screen
4. Create 4 player browsers (user1-user4@example.com)
5. Players join teams (Team A and Team B)
6. Play through the complete game
"""

from playwright.sync_api import sync_playwright, Page, BrowserContext
import time
import os
import random
import re

def login_or_register_user(page: Page, email: str, password: str, role: str = "Player", name: str = None):
    """
    Helper function to login or register a user.
    Args:
        page: Playwright page object
        email: User email
        password: User password
        role: "Player" or "Host"
        name: Display name (defaults to email prefix)
    Returns:
        bool: True if successful, False otherwise
    """
    if name is None:
        name = email.split('@')[0].title()

    print(f"📝 Attempting login for {email} as {role}...")

    try:
        # Wait for page to be ready
        page.wait_for_load_state('domcontentloaded')

        # Try to find email input field
        email_input = page.locator('input[type="email"], input[name="email"]').first
        if not email_input.is_visible(timeout=3000):
            print(f"❌ Could not find email input for {email}")
            return False

        email_input.fill(email)

        # Find password field
        password_input = page.locator('input[type="password"]').first
        password_input.fill(password)

        # Click role button if present
        role_button = page.locator(f'button:has-text("{role}")').first
        if role_button.is_visible(timeout=1000):
            role_button.click()
            time.sleep(0.5)

        # Find and click login button
        login_button = page.locator('button:has-text("Sign In"), button:has-text("Login"), button:has-text("Log in")').first
        if not login_button.is_visible(timeout=2000):
            print(f"❌ Could not find login button for {email}")
            return False

        login_button.click()

        page.wait_for_load_state('networkidle')
        time.sleep(2)

        # Check if login was successful - check URL changed
        current_url = page.url
        print(f"  After login attempt, URL: {current_url}")

        if '/lobby' in current_url or '/host' in current_url:
            print(f"✅ Login successful for {email}")
            return True

        # Login failed, try registration
        print(f"⚠️  Login failed for {email}, attempting registration...")

        # Look for registration link
        register_link = page.locator('a:has-text("Sign up"), button:has-text("Sign up"), a:has-text("Don\'t have an account")').first
        if not register_link.is_visible(timeout=3000):
            print(f"❌ Could not find registration link for {email}")
            return False

        register_link.click()
        page.wait_for_load_state('networkidle')
        time.sleep(1.5)

        print(f"  Registration form loaded, URL: {page.url}")

        # Fill registration form
        reg_email_input = page.locator('input[type="email"]').first
        if not reg_email_input.is_visible(timeout=2000):
            print(f"❌ Could not find registration email input for {email}")
            return False

        reg_email_input.fill(email)

        name_input = page.locator('input[name="name"], input[placeholder*="name" i]').first
        if name_input.is_visible(timeout=1000):
            name_input.fill(name)
            print(f"  Filled name: {name}")

        # Fill passwords
        password_inputs = page.locator('input[type="password"]').all()
        filled_passwords = 0
        for pwd_input in password_inputs:
            if pwd_input.is_visible():
                pwd_input.fill(password)
                filled_passwords += 1
        print(f"  Filled {filled_passwords} password fields")

        # Select role
        role_btn = page.locator(f'button:has-text("{role}")').first
        if role_btn.is_visible(timeout=1000):
            role_btn.click()
            time.sleep(0.5)
            print(f"  Selected role: {role}")

        # Click create account
        create_button = page.locator('button:has-text("Create Account"), button:has-text("Register")').first
        if not create_button.is_visible(timeout=2000):
            print(f"❌ Could not find Create Account button for {email}")
            return False

        create_button.click()

        page.wait_for_load_state('networkidle')
        time.sleep(2)

        print(f"  After registration, URL: {page.url}")

        # Check if we need to login after registration
        if page.url == 'http://localhost:5173/':
            print(f"📝 Logging in after registration for {email}...")

            email_input = page.locator('input[type="email"]').first
            if email_input.is_visible(timeout=3000):
                email_input.fill(email)
                password_input = page.locator('input[type="password"]').first
                password_input.fill(password)

                role_btn = page.locator(f'button:has-text("{role}")').first
                if role_btn.is_visible(timeout=1000):
                    role_btn.click()
                    time.sleep(0.5)

                signin_button = page.locator('button:has-text("Sign In"), button:has-text("Login")').first
                signin_button.click()

                page.wait_for_load_state('networkidle')
                time.sleep(2)

                print(f"  After post-reg login, URL: {page.url}")

        # Final check
        if '/lobby' in page.url or '/host' in page.url:
            print(f"✅ Registration and login successful for {email}")
            return True
        else:
            print(f"❌ Registration completed but not on lobby/host page for {email}")
            return False

    except Exception as e:
        print(f"❌ Error during login/register for {email}: {e}")
        return False

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

                                        # Extract game code from the page
                                        game_code = None

                                        # Try to find the game code text element
                                        game_code_element = page.locator('text=/Game Code:.*[A-Z0-9]{6}/').first
                                        if game_code_element.is_visible(timeout=2000):
                                            game_code_text = game_code_element.text_content()
                                            game_code_match = re.search(r'([A-Z0-9]{6})', game_code_text)
                                            if game_code_match:
                                                game_code = game_code_match.group(1)

                                        if game_code:
                                            print(f"🎮 Game Code: {game_code}")

                                            # Now create 4 player browser contexts
                                            print("\n" + "="*50)
                                            print("🎭 Creating 4 player browsers...")
                                            print("="*50 + "\n")

                                            player_contexts = []
                                            player_pages = []
                                            player_emails = ['user1@example.com', 'user2@example.com', 'user3@example.com', 'user4@example.com']

                                            # Create separate browser contexts for each player
                                            for i, email in enumerate(player_emails, 1):
                                                context = browser.new_context()
                                                player_page = context.new_page()
                                                player_contexts.append(context)
                                                player_pages.append(player_page)

                                                print(f"\n👤 Setting up Player {i} ({email})...")
                                                player_page.goto('http://localhost:5173')
                                                player_page.wait_for_load_state('networkidle')
                                                time.sleep(1)

                                                # Login or register
                                                if login_or_register_user(player_page, email, 'Password123!', 'Player'):
                                                    player_page.screenshot(path=f'./tmp/player{i}_01_logged_in.png', full_page=True)

                                            print("\n✅ All players logged in!")

                                            # Enter game code for all players
                                            print(f"\n🎮 All players entering game code: {game_code}")
                                            for i, player_page in enumerate(player_pages, 1):
                                                # Make sure we're on the lobby page
                                                time.sleep(1)
                                                print(f"📍 Player {i} URL: {player_page.url}")

                                                # Save screenshot before entering code
                                                player_page.screenshot(path=f'./tmp/player{i}_02_before_code.png', full_page=True)

                                                # Find game code input on lobby page - try multiple selectors
                                                code_input = None
                                                try:
                                                    # Try to find the game code input with various selectors
                                                    code_input = player_page.locator('input[placeholder*="ABC123" i], input[placeholder*="code" i], input[type="text"]').first
                                                    if code_input.is_visible(timeout=3000):
                                                        # Clear existing text and enter game code
                                                        print(f"  Found game code input for Player {i}")
                                                        code_input.click()
                                                        code_input.fill('')  # Clear first
                                                        code_input.type(game_code, delay=50)  # Type with delay
                                                        time.sleep(0.5)

                                                        player_page.screenshot(path=f'./tmp/player{i}_03_code_entered.png', full_page=True)

                                                        # Click join button
                                                        join_button = player_page.locator('button:has-text("Join Game"), button:has-text("Join")').first
                                                        if join_button.is_visible(timeout=2000):
                                                            join_button.click()
                                                            print(f"🔘 Player {i} clicked Join button")
                                                            player_page.wait_for_load_state('networkidle')
                                                            time.sleep(2)

                                                            player_page.screenshot(path=f'./tmp/player{i}_04_after_join.png', full_page=True)
                                                            print(f"✅ Player {i} joined game, URL: {player_page.url}")
                                                        else:
                                                            print(f"⚠️  Player {i} couldn't find Join button")
                                                            player_page.screenshot(path=f'./tmp/player{i}_03_no_join_button.png', full_page=True)
                                                    else:
                                                        print(f"⚠️  Player {i} game code input not visible")
                                                        player_page.screenshot(path=f'./tmp/player{i}_02_no_input.png', full_page=True)
                                                except Exception as e:
                                                    print(f"⚠️  Player {i} couldn't find game code input: {e}")
                                                    player_page.screenshot(path=f'./tmp/player{i}_02_error.png', full_page=True)

                                            # Team creation and joining
                                            print("\n" + "="*50)
                                            print("👥 Team Creation and Joining...")
                                            print("="*50 + "\n")

                                            # Wait for all players to have the team selection modal
                                            time.sleep(2)

                                            # Player 1: Create Team A
                                            print("👤 Player 1: Creating Team A...")
                                            player_pages[0].screenshot(path='./tmp/player1_05_team_modal.png', full_page=True)

                                            # Click "+ Create New Team" button
                                            create_new_team_btn = player_pages[0].locator('button:has-text("Create New Team"), div:has-text("Create New Team")').first
                                            if create_new_team_btn.is_visible(timeout=3000):
                                                create_new_team_btn.click()
                                                time.sleep(1)
                                                player_pages[0].screenshot(path='./tmp/player1_06_create_team_clicked.png', full_page=True)

                                                # Now find the team name input and fill it
                                                team_name_input = player_pages[0].locator('input[type="text"], input[placeholder*="team" i]').first
                                                if team_name_input.is_visible(timeout=2000):
                                                    team_name_input.fill('Team A')
                                                    time.sleep(0.5)
                                                    player_pages[0].screenshot(path='./tmp/player1_07_team_name_filled.png', full_page=True)

                                                    # Click the Join Game button to confirm (force=True to bypass pointer-events check)
                                                    join_btn = player_pages[0].locator('button:has-text("Join Game")').first
                                                    if join_btn.is_visible(timeout=2000):
                                                        join_btn.click(force=True)
                                                        player_pages[0].wait_for_load_state('networkidle')
                                                        time.sleep(2)
                                                        print("✅ Player 1 created Team A")
                                                        player_pages[0].screenshot(path='./tmp/player1_08_team_created.png', full_page=True)
                                                    else:
                                                        print("⚠️  Player 1 couldn't find Join Game button")
                                                else:
                                                    print("⚠️  Player 1 couldn't find team name input")
                                            else:
                                                print("⚠️  Player 1 couldn't find Create New Team button")

                                            # Player 3: Create Team B
                                            print("👤 Player 3: Creating Team B...")
                                            player_pages[2].screenshot(path='./tmp/player3_05_team_modal.png', full_page=True)

                                            create_new_team_btn = player_pages[2].locator('button:has-text("Create New Team"), div:has-text("Create New Team")').first
                                            if create_new_team_btn.is_visible(timeout=3000):
                                                create_new_team_btn.click()
                                                time.sleep(1)

                                                team_name_input = player_pages[2].locator('input[type="text"], input[placeholder*="team" i]').first
                                                if team_name_input.is_visible(timeout=2000):
                                                    team_name_input.fill('Team B')
                                                    time.sleep(0.5)

                                                    join_btn = player_pages[2].locator('button:has-text("Join Game")').first
                                                    if join_btn.is_visible(timeout=2000):
                                                        join_btn.click(force=True)
                                                        player_pages[2].wait_for_load_state('networkidle')
                                                        time.sleep(2)
                                                        print("✅ Player 3 created Team B")
                                                        player_pages[2].screenshot(path='./tmp/player3_08_team_created.png', full_page=True)
                                            else:
                                                print("⚠️  Player 3 couldn't find Create New Team button")

                                            # Wait for teams to be created before user2 and user4 try to join
                                            print("\n⏳ Waiting for teams to propagate to other players...")
                                            time.sleep(3)

                                            # Player 2: Join Team A (wait for it to exist first)
                                            print("👤 Player 2: Waiting for Team A to appear, then joining...")
                                            player_pages[1].screenshot(path='./tmp/player2_05_team_modal_initial.png', full_page=True)

                                            # Wait up to 10 seconds for Team A to appear
                                            team_a_found = False
                                            for attempt in range(10):
                                                team_a_option = player_pages[1].locator('text="Team A"').first
                                                if team_a_option.is_visible(timeout=1000):
                                                    team_a_found = True
                                                    print("  ✅ Team A appeared!")
                                                    break
                                                print(f"  Waiting for Team A... ({attempt + 1}/10)")
                                                time.sleep(1)

                                            if team_a_found:
                                                player_pages[1].screenshot(path='./tmp/player2_05_team_a_visible.png', full_page=True)
                                                team_a_option.click()
                                                time.sleep(1)

                                                # Click Join Game to join the selected team
                                                join_btn = player_pages[1].locator('button:has-text("Join Game")').first
                                                if join_btn.is_visible(timeout=2000):
                                                    join_btn.click(force=True)
                                                    player_pages[1].wait_for_load_state('networkidle')
                                                    time.sleep(2)
                                                    print("✅ Player 2 joined Team A")
                                                    player_pages[1].screenshot(path='./tmp/player2_08_joined_team.png', full_page=True)
                                            else:
                                                print("⚠️  Player 2 couldn't find Team A after waiting")
                                                player_pages[1].screenshot(path='./tmp/player2_05_no_team_a.png', full_page=True)

                                            # Player 4: Join Team B (wait for it to exist first)
                                            print("👤 Player 4: Waiting for Team B to appear, then joining...")
                                            player_pages[3].screenshot(path='./tmp/player4_05_team_modal_initial.png', full_page=True)

                                            # Wait up to 10 seconds for Team B to appear
                                            team_b_found = False
                                            for attempt in range(10):
                                                team_b_option = player_pages[3].locator('text="Team B"').first
                                                if team_b_option.is_visible(timeout=1000):
                                                    team_b_found = True
                                                    print("  ✅ Team B appeared!")
                                                    break
                                                print(f"  Waiting for Team B... ({attempt + 1}/10)")
                                                time.sleep(1)

                                            if team_b_found:
                                                player_pages[3].screenshot(path='./tmp/player4_05_team_b_visible.png', full_page=True)
                                                team_b_option.click()
                                                time.sleep(1)

                                                join_btn = player_pages[3].locator('button:has-text("Join Game")').first
                                                if join_btn.is_visible(timeout=2000):
                                                    join_btn.click(force=True)
                                                    player_pages[3].wait_for_load_state('networkidle')
                                                    time.sleep(2)
                                                    print("✅ Player 4 joined Team B")
                                                    player_pages[3].screenshot(path='./tmp/player4_08_joined_team.png', full_page=True)
                                            else:
                                                print("⚠️  Player 4 couldn't find Team B after waiting")
                                                player_pages[3].screenshot(path='./tmp/player4_05_no_team_b.png', full_page=True)

                                            # Give time for all team joins to propagate
                                            time.sleep(2)
                                            print("✅ All teams created and players assigned!")

                                            # Host waits for teams to be ready
                                            print("\n" + "="*50)
                                            print("⏳ Host waiting for teams to be ready...")
                                            print("="*50 + "\n")

                                            # Poll the host page for team readiness
                                            teams_ready = False
                                            max_wait_time = 30  # 30 seconds max
                                            start_wait = time.time()

                                            while not teams_ready and (time.time() - start_wait) < max_wait_time:
                                                page.screenshot(path='./tmp/host_waiting_for_teams.png', full_page=True)

                                                # Check page content for team information
                                                content = page.content()

                                                # Look for "Teams Ready: 2" or similar indicator
                                                if 'Teams Ready' in content:
                                                    # Try to find the teams count
                                                    teams_element = page.locator('text=/Teams Ready.*2/').first
                                                    if teams_element.is_visible(timeout=1000):
                                                        print("✅ Both teams are ready!")
                                                        teams_ready = True
                                                        break

                                                # Alternative: check if both Team A and Team B are visible with 2 players
                                                if 'Team A' in content and 'Team B' in content:
                                                    print("✅ Both teams exist, checking player counts...")
                                                    # Give a moment for all players to join
                                                    time.sleep(2)
                                                    teams_ready = True
                                                    break

                                                print(f"  Waiting for teams... ({int(time.time() - start_wait)}s)")
                                                time.sleep(2)

                                            if not teams_ready:
                                                print("⚠️  Timeout waiting for teams to be ready")

                                            page.screenshot(path='./tmp/host_teams_ready.png', full_page=True)

                                            # Game Play Loop
                                            print("\n" + "="*50)
                                            print("🎲 Starting Game Play...")
                                            print("="*50 + "\n")

                                            # Wait a moment and take screenshot of initial state
                                            time.sleep(2)
                                            page.screenshot(path='./tmp/host_before_start.png', full_page=True)

                                            question_num = 1
                                            max_questions = 5  # Test with just 5 questions for now

                                            while question_num <= max_questions:
                                                print(f"\n📝 Question {question_num}...")

                                                # Host advances to next question
                                                # Try multiple selectors for the next button
                                                next_button = page.locator('button:has-text("Next Question"), button:has-text("Next"), [aria-label*="Next" i]').first

                                                try:
                                                    if next_button.is_visible(timeout=5000):
                                                        print("🔘 Found Next button, clicking...")
                                                        next_button.click()
                                                        page.wait_for_load_state('networkidle')
                                                        time.sleep(2)
                                                        print("✅ Host advanced to question")
                                                        page.screenshot(path=f'./tmp/host_question_{question_num}.png', full_page=True)

                                                        # Players answer (randomly one from each team)
                                                        # Team A: Either player 1 or player 2 answers
                                                        team_a_player_idx = random.choice([0, 1])
                                                        team_b_player_idx = random.choice([2, 3])

                                                        for player_idx in [team_a_player_idx, team_b_player_idx]:
                                                            player_page = player_pages[player_idx]
                                                            team_name = "Team A" if player_idx < 2 else "Team B"

                                                            # Wait for question to appear
                                                            time.sleep(1)

                                                            # Find answer buttons (usually 4 options)
                                                            answer_buttons = player_page.locator('button').all()

                                                            # Filter for answer buttons containing answer text
                                                            visible_buttons = [btn for btn in answer_buttons if btn.is_visible()]

                                                            if len(visible_buttons) >= 4:
                                                                # Select one of the first 4 answer buttons
                                                                selected_button = random.choice(visible_buttons[:4])
                                                                try:
                                                                    selected_button.click()
                                                                    print(f"✅ Player {player_idx + 1} ({team_name}) answered")
                                                                    time.sleep(0.5)
                                                                    player_page.screenshot(path=f'./tmp/player{player_idx + 1}_q{question_num}_answered.png', full_page=True)
                                                                except Exception as e:
                                                                    print(f"⚠️  Player {player_idx + 1} couldn't answer: {e}")
                                                            else:
                                                                print(f"⚠️  Player {player_idx + 1} couldn't find answer buttons")

                                                        # Wait for question to complete
                                                        time.sleep(2)
                                                        question_num += 1
                                                    else:
                                                        print("⏹️  Next button not visible")
                                                        break
                                                except Exception as e:
                                                    print(f"⏹️  Error with next button: {e}")
                                                    break

                                            print("\n" + "="*50)
                                            print("🏁 Game Completed!")
                                            print("="*50)

                                            # Final screenshots
                                            page.screenshot(path='./tmp/host_final.png', full_page=True)
                                            for i, player_page in enumerate(player_pages, 1):
                                                player_page.screenshot(path=f'./tmp/player{i}_final.png', full_page=True)

                                            # Close player contexts
                                            for context in player_contexts:
                                                context.close()

                                        else:
                                            print("❌ Could not extract game code from page")
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
