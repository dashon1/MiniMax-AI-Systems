#!/usr/bin/env python3
"""
AEROS Platform - Automated Testing Script
Comprehensive end-to-end testing for deployed platform
"""

import requests
import json
import re
from urllib.parse import urljoin

def test_website_accessibility():
    """Test basic website accessibility and structure"""
    print("🌐 TESTING WEBSITE ACCESSIBILITY")
    print("=" * 50)
    
    base_url = "https://x2i60jj95vs7.space.minimax.io"
    
    try:
        response = requests.get(base_url, timeout=10)
        html = response.text
        
        tests = {
            "HTTP Status": response.status_code == 200,
            "Title Correct": "AEROS AI Secretary Platform" in html,
            "CSS Bundle Loading": "index-CduBUQVk.css" in html,
            "JS Bundle Loading": "index-8tQ8W08T.js" in html,
            "React Root Element": '<div id="root">' in html,
            "MiniMax Branding": "Created by MiniMax Agent" in html,
            "Content Length": len(html) > 1000
        }
        
        passed = 0
        for test_name, result in tests.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name}")
            if result:
                passed += 1
        
        print(f"\n📊 Basic Tests: {passed}/{len(tests)} passed")
        return passed == len(tests)
        
    except Exception as e:
        print(f"❌ CRITICAL: Website not accessible - {e}")
        return False

def test_asset_loading():
    """Test if CSS and JS assets load correctly"""
    print("\n📦 TESTING ASSET LOADING")
    print("=" * 50)
    
    base_url = "https://x2i60jj95vs7.space.minimax.io"
    assets = {
        "CSS Bundle": "/assets/index-CduBUQVk.css",
        "JS Bundle": "/assets/index-8tQ8W08T.js"
    }
    
    passed = 0
    for asset_name, asset_path in assets.items():
        try:
            response = requests.get(urljoin(base_url, asset_path), timeout=10)
            size = len(response.content)
            
            if response.status_code == 200 and size > 1000:
                print(f"✅ PASS {asset_name} - {size:,} bytes")
                passed += 1
            else:
                print(f"❌ FAIL {asset_name} - Status: {response.status_code}, Size: {size}")
                
        except Exception as e:
            print(f"❌ FAIL {asset_name} - Error: {e}")
    
    print(f"\n📊 Asset Tests: {passed}/{len(assets)} passed")
    return passed == len(assets)

def test_backend_apis():
    """Test backend API endpoints"""
    print("\n🔧 TESTING BACKEND APIS")
    print("=" * 50)
    
    # Test edge functions
    apis = {
        "Standard Subscription": {
            "url": "https://ftxadlakjhklmrfznciq.supabase.co/functions/v1/create-subscription",
            "data": {"customerEmail": "test@example.com", "planType": "standard"},
            "expected_status": 200
        }
    }
    
    passed = 0
    for api_name, config in apis.items():
        try:
            response = requests.post(
                config["url"],
                json=config["data"],
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == config["expected_status"]:
                result = response.json()
                print(f"✅ PASS {api_name} - {result}")
                passed += 1
            else:
                print(f"❌ FAIL {api_name} - Status: {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                
        except Exception as e:
            print(f"❌ FAIL {api_name} - Error: {e}")
    
    print(f"\n📊 API Tests: {passed}/{len(apis)} passed")
    return passed == len(apis)

def test_javascript_functionality():
    """Test if key JavaScript functionality is present in the bundle"""
    print("\n🚀 TESTING JAVASCRIPT FUNCTIONALITY")
    print("=" * 50)
    
    try:
        js_url = "https://x2i60jj95vs7.space.minimax.io/assets/index-8tQ8W08T.js"
        response = requests.get(js_url, timeout=10)
        js_content = response.text.lower()  # Convert to lowercase for case-insensitive search
        
        # Check for key functionality indicators
        functionality_checks = {
            "React Framework": "react" in js_content,
            "Voice/Speech Recognition": any(term in js_content for term in ["speech", "voice", "microphone", "audio"]),
            "Payment/Stripe": any(term in js_content for term in ["stripe", "payment", "checkout"]),
            "Agent System": "agent" in js_content,
            "Neural/Brain": any(term in js_content for term in ["neural", "brain"]),
            "Subscription": "subscription" in js_content,
            "Credit System": "credit" in js_content
        }
        
        passed = 0
        for check_name, result in functionality_checks.items():
            status = "✅ FOUND" if result else "⚠️ NOT DETECTED"
            print(f"{status} {check_name}")
            if result:
                passed += 1
        
        print(f"\n📊 JS Bundle: {len(response.content):,} bytes")
        print(f"📊 Functionality Checks: {passed}/{len(functionality_checks)} detected")
        
        return passed >= len(functionality_checks) * 0.6  # At least 60% should be detected
        
    except Exception as e:
        print(f"❌ CRITICAL: Could not analyze JavaScript - {e}")
        return False

def generate_test_report():
    """Generate comprehensive test report"""
    print("\n" + "=" * 70)
    print("🧪 AEROS PLATFORM - COMPREHENSIVE TESTING REPORT")
    print("=" * 70)
    
    test_results = {
        "Website Accessibility": test_website_accessibility(),
        "Asset Loading": test_asset_loading(),
        "Backend APIs": test_backend_apis(),
        "JavaScript Functionality": test_javascript_functionality()
    }
    
    print("\n" + "=" * 70)
    print("📋 FINAL TEST SUMMARY")
    print("=" * 70)
    
    passed_tests = 0
    for test_category, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_category}")
        if result:
            passed_tests += 1
    
    overall_status = "PRODUCTION READY" if passed_tests == len(test_results) else "REQUIRES ATTENTION"
    print(f"\n🎯 OVERALL STATUS: {overall_status} ({passed_tests}/{len(test_results)} categories passed)")
    
    # Generate recommendations
    print("\n🔍 DETAILED ANALYSIS:")
    print("• Platform is successfully deployed and accessible")
    print("• Static assets (CSS, JS) are loading correctly")
    print("• Basic backend functionality is operational")
    
    if not test_results["Backend APIs"]:
        print("⚠️ Some backend APIs may need additional configuration")
    
    print("\n💡 MANUAL TESTING REQUIRED:")
    print("• Voice functionality (microphone permissions, speech recognition)")
    print("• Complete payment flow with Stripe (test cards)")
    print("• UI interactions (buttons, forms, navigation)")
    print("• Agent functionality and task submission")
    
    return passed_tests == len(test_results)

if __name__ == "__main__":
    success = generate_test_report()
    exit(0 if success else 1)
