class AddDefaultToFreeAgencyPeriodIsActive < ActiveRecord::Migration[8.1]
  def change
    change_column_default :free_agency_periods, :is_active, from: nil, to: false
  end
end
