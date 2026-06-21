import os
import telebot
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton, Update
from dotenv import load_dotenv
from flask import Flask, request, abort

load_dotenv()

# The BOT_TOKEN is loaded from the environment variables (Vercel settings or .env locally)
BOT_TOKEN = os.getenv("BOT_TOKEN")
if not BOT_TOKEN:
    raise ValueError("No BOT_TOKEN provided. Please set it in your environment variables.")

bot = telebot.TeleBot(BOT_TOKEN)
app = Flask(__name__)

@bot.message_handler(commands=['start'])
def send_welcome(message):
    welcome_text = """I can help you create and manage Telegram bots. If you're new to the Bot API, please see the manual.

You can control me by sending these commands:

/newbot - create a new bot
/mybots - edit your bots

Edit Bots
/setname - change a bot's name
/setdescription - change bot description
/setabouttext - change bot about info
/setuserpic - change bot profile photo
/setcommands - change the list of commands
/deletebot - delete a bot

Bot Settings
/token - get authorization token
/revoke - revoke bot access token
/setinline - toggle inline mode
/setinlinegeo - toggle inline location requests
/setinlinefeedback - change inline feedback settings
/setjoingroups - can your bot be added to groups?
/setprivacy - toggle privacy mode in groups

Web Apps
/myapps - edit your web apps
/newapp - create a new web app
/listapps - get a list of your web apps
/editapp - edit a web app
/deleteapp - delete an existing web app

Games
/mygames - edit your games
/newgame - create a new game
/listgames - get a list of your games
/editgame - edit a game
/deletegame - delete an existing game"""
    bot.send_message(message.chat.id, welcome_text)

@bot.message_handler(commands=['mybots'])
def send_mybots(message):
    markup = InlineKeyboardMarkup()
    btn = InlineKeyboardButton("@mrkt", callback_data="bot_mrkt")
    markup.add(btn)
    bot.send_message(message.chat.id, "Choose a bot from the list below:", reply_markup=markup)

@bot.callback_query_handler(func=lambda call: True)
def callback_query(call):
    try:
        if call.data == "bot_mrkt":
            markup = InlineKeyboardMarkup(row_width=2)
            btn_api = InlineKeyboardButton("API Token", callback_data="api_token")
            btn_edit = InlineKeyboardButton("Edit Bot", callback_data="edit_bot")
            btn_settings = InlineKeyboardButton("Bot Settings", callback_data="bot_settings")
            btn_payments = InlineKeyboardButton("Payments", callback_data="payments")
            btn_transfer = InlineKeyboardButton("Transfer Ownership", callback_data="transfer_ownership")
            btn_delete = InlineKeyboardButton("Delete Bot", callback_data="delete_bot")
            btn_back = InlineKeyboardButton("« Back to Bot List", callback_data="back_to_list")
            
            # Add buttons in rows of 2
            markup.add(btn_api, btn_edit)
            markup.add(btn_settings, btn_payments)
            markup.add(btn_transfer, btn_delete)
            markup.add(btn_back)
            
            bot.edit_message_text(
                chat_id=call.message.chat.id,
                message_id=call.message.message_id,
                text="Here it is: P2P Bot @mrkt.\nWhat do you want to do with the bot?",
                reply_markup=markup
            )
        elif call.data == "back_to_list":
            markup = InlineKeyboardMarkup()
            btn = InlineKeyboardButton("@mrkt", callback_data="bot_mrkt")
            markup.add(btn)
            bot.edit_message_text(
                chat_id=call.message.chat.id,
                message_id=call.message.message_id,
                text="Choose a bot from the list below:",
                reply_markup=markup
            )
        else:
            bot.answer_callback_query(call.id, "This button works, but has no action defined yet.")
            
        bot.answer_callback_query(call.id)
    except telebot.apihelper.ApiTelegramException as e:
        if "message is not modified" not in e.description:
            raise e

# The webhook route
@app.route('/api', methods=['POST'])
def webhook():
    if request.headers.get('content-type') == 'application/json':
        json_string = request.get_data().decode('utf-8')
        update = Update.de_json(json_string)
        bot.process_new_updates([update])
        return ''
    else:
        abort(403)

@app.route('/', methods=['GET'])
def index():
    return 'Bot is running!'

# No infinity_polling here since Vercel handles requests via webhooks
