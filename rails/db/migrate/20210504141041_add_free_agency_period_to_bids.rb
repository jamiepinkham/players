class AddFreeAgencyPeriodToBids < ActiveRecord::Migration[5.0]
  def change
    add_reference :bids, :free_agency_period, foreign_key: true
  end
end
