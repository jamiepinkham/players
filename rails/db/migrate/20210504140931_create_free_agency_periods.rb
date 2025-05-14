class CreateFreeAgencyPeriods < ActiveRecord::Migration[5.0]
  def change
    create_table :free_agency_periods do |t|
      t.boolean :is_active
      t.references :season, foreign_key: true
      t.datetime :start_date
      t.datetime :end_date

      t.timestamps
    end
  end
end
