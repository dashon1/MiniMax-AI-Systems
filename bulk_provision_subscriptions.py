#!/usr/bin/env python3
"""
Bulk Subscription Provisioning Script
Provisions default subscriptions for all existing users
"""

import requests
import json
import time

def provision_subscriptions():
    print("🔄 BULK PROVISIONING SUBSCRIPTIONS FOR EXISTING USERS")
    print("=" * 60)
    
    # Users without subscriptions (from SQL query)
    users_without_subscriptions = [
        "1ebdbe47-b635-449a-b66c-fa3f9ea26963",
        "5e144040-a8da-49b2-bc13-adee02719dbc", 
        "1a5beb44-a219-41d8-a61d-8d02eb8e889b",
        "f04003c1-69de-4403-8e50-b1da3d3d5637",
        "cc1df013-2777-4337-9315-129833dc4a13",
        "7affe665-a430-4921-ac05-c5175a9e6d5b",
        "f2cf8767-d970-4b30-83a3-23fc726beb56",
        "c4908143-82d4-47d6-a8d0-89aac5b49e31",
        "c096a985-39c7-43b4-8a1d-907971d8238c",
        "b6b06a62-799c-4553-a21a-d3b0cc061908"
    ]
    
    base_url = "https://ftxadlakjhklmrfznciq.supabase.co/functions/v1/provision-user-subscription"
    
    successful_provisions = 0
    failed_provisions = 0
    
    for user_id in users_without_subscriptions:
        try:
            print(f"\n📦 Provisioning subscription for user: {user_id[:8]}...")
            
            response = requests.post(base_url, 
                json={"user_id": user_id},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    subscription_id = data["data"]["subscription"]["id"]
                    credits = data["data"]["subscription"]["current_credits"]
                    print(f"✅ SUCCESS: Subscription {subscription_id} created with {credits} credits")
                    successful_provisions += 1
                else:
                    print(f"❌ FAILED: {data.get('error', {}).get('message', 'Unknown error')}")
                    failed_provisions += 1
            else:
                print(f"❌ FAILED: HTTP {response.status_code} - {response.text}")
                failed_provisions += 1
                
            # Small delay to avoid overwhelming the API
            time.sleep(0.5)
            
        except Exception as e:
            print(f"❌ ERROR: {e}")
            failed_provisions += 1
    
    print(f"\n🎯 BULK PROVISIONING COMPLETE")
    print(f"✅ Successful: {successful_provisions}")
    print(f"❌ Failed: {failed_provisions}")
    print(f"📊 Total: {len(users_without_subscriptions)}")
    
    if successful_provisions == len(users_without_subscriptions):
        print("🎉 ALL USERS NOW HAVE SUBSCRIPTIONS!")
        return True
    else:
        print("⚠️  Some users still need manual provisioning")
        return False

if __name__ == "__main__":
    provision_subscriptions()
