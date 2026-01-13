# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2026_01_13_050000) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_stat_statements"
  enable_extension "plpgsql"

  create_table "bids", id: :serial, force: :cascade do |t|
    t.integer "player_id"
    t.integer "team_id"
    t.integer "number_of_years"
    t.decimal "annual_amount"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "is_active", default: true, null: false
    t.boolean "is_leading", default: false, null: false
    t.integer "contract_id"
    t.integer "free_agency_period_id"
    t.integer "first_season_id"
    t.integer "last_season_id"
    t.index ["first_season_id"], name: "index_bids_on_first_season_id"
    t.index ["free_agency_period_id"], name: "index_bids_on_free_agency_period_id"
    t.index ["last_season_id"], name: "index_bids_on_last_season_id"
  end

  create_table "contracts", id: :serial, force: :cascade do |t|
    t.decimal "amount"
    t.integer "final_year"
    t.integer "team_id"
    t.integer "player_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "active", default: true
    t.boolean "summer"
    t.boolean "franchise"
    t.integer "bid_id"
    t.integer "first_season_id"
    t.integer "last_season_id"
    t.index ["active"], name: "index_contracts_on_active"
    t.index ["bid_id"], name: "index_contracts_on_bid_id"
    t.index ["first_season_id", "last_season_id"], name: "index_contracts_on_first_season_id_and_last_season_id"
    t.index ["first_season_id"], name: "index_contracts_on_first_season_id"
    t.index ["last_season_id"], name: "index_contracts_on_last_season_id"
    t.index ["player_id", "active"], name: "index_contracts_on_player_id_and_active"
    t.index ["player_id"], name: "index_contracts_on_player_id"
    t.index ["team_id"], name: "index_contracts_on_team_id"
  end

  create_table "contracts_trades", force: :cascade do |t|
    t.integer "contract_id"
    t.integer "trade_id"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "free_agency_periods", id: :serial, force: :cascade do |t|
    t.boolean "is_active"
    t.integer "season_id"
    t.datetime "start_date"
    t.datetime "end_date"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "max_bids_for_team", default: 7
    t.integer "max_contract_length", default: 5
    t.index ["season_id"], name: "index_free_agency_periods_on_season_id"
  end

  create_table "jwt_denylist", id: :serial, force: :cascade do |t|
    t.string "jti", null: false
    t.datetime "exp", null: false
    t.index ["jti"], name: "index_jwt_denylist_on_jti"
  end

  create_table "players", id: :serial, force: :cascade do |t|
    t.string "name"
    t.string "position"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "bbrefid"
    t.string "bbref_minors"
    t.json "bbref_stats"
    t.index ["bbrefid"], name: "index_players_on_bbrefid"
    t.index ["name"], name: "index_players_on_name"
    t.index ["position"], name: "index_players_on_position"
  end

  create_table "seasons", id: :serial, force: :cascade do |t|
    t.string "name"
    t.boolean "is_active"
    t.datetime "start_date"
    t.datetime "end_date"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "previous_season_id"
    t.bigint "next_season_id"
    t.boolean "is_finished", default: false
  end

  create_table "team_emails", force: :cascade do |t|
    t.bigint "team_id", null: false
    t.string "email", null: false
    t.boolean "primary", default: false, null: false
    t.boolean "receive_trade_notifications", default: true, null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["team_id", "email"], name: "index_team_emails_on_team_id_and_email", unique: true
    t.index ["team_id"], name: "index_team_emails_on_team_id"
  end

  create_table "teams", id: :serial, force: :cascade do |t|
    t.string "name"
    t.decimal "budget"
    t.string "stadium"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "comment"
  end

  create_table "trades", force: :cascade do |t|
    t.integer "from_team_id", null: false
    t.integer "to_team_id", null: false
    t.integer "from_cash_amount", default: 0, null: false
    t.integer "to_cash_amount", default: 0, null: false
    t.integer "status", default: 0, null: false
    t.string "note"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "users", id: :serial, force: :cascade do |t|
    t.string "username", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.inet "current_sign_in_ip"
    t.inet "last_sign_in_ip"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "name"
    t.integer "team_id"
    t.boolean "is_admin", default: false, null: false
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["team_id"], name: "index_users_on_team_id"
    t.index ["username"], name: "index_users_on_username", unique: true
  end

  add_foreign_key "bids", "free_agency_periods"
  add_foreign_key "contracts", "bids"
  add_foreign_key "contracts", "players"
  add_foreign_key "contracts", "teams"
  add_foreign_key "free_agency_periods", "seasons"
  add_foreign_key "team_emails", "teams"
  add_foreign_key "users", "teams", on_delete: :nullify
end
